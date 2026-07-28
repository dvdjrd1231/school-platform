import { z } from "zod"

import { Course, FileAsset } from "@/lib/models"
import { FILE_CONTEXTS, type FileContext } from "@/lib/models/FileAsset"
import {
  ApiError,
  handleErrors,
  hasRole,
  json,
  parseBody,
  requireUser,
} from "@/lib/api/helpers"
import { childrenOf, courseScope } from "@/lib/api/scope"
import { youtubeVideoId } from "@/lib/media/youtube"
import { MAX_UPLOAD_BYTES, assertAllowedType, saveFile } from "@/lib/storage/gridfs"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/files?context=…&courseId=…&category=…
 *
 * Lists file metadata only — bytes come from /api/files/:id/download. Results
 * are always filtered to what the caller may see:
 *   private → owner (and admins)
 *   course  → anyone in that course
 *   school  → any signed-in user
 */
export async function GET(req: Request) {
  try {
    const me = await requireUser()
    const url = new URL(req.url)
    const context = url.searchParams.get("context")
    const courseId = url.searchParams.get("courseId")
    const category = url.searchParams.get("category")
    const student = url.searchParams.get("studentId")

    const filter: Record<string, unknown> = {}
    if (context) {
      if (!FILE_CONTEXTS.includes(context as FileContext)) {
        throw new ApiError(400, `Unknown context: ${context}`)
      }
      filter.context = context
    }
    if (courseId) filter.course = courseId
    if (student) filter.student = student
    // Prefix match: asking for "1st Grade" returns everything filed beneath it.
    if (category) filter.categoryPath = { $all: category.split("/").filter(Boolean) }

    if (!hasRole(me, "admin")) {
      const scope = await courseScope(me)
      const visible: Record<string, unknown>[] = [
        { owner: me.id },
        { visibility: "school" },
        { visibility: "course", course: { $in: scope.ids } },
        // Anything filed about you — report cards — is yours to read.
        { student: me.id },
      ]
      // And a guardian reads their children's.
      if (hasRole(me, "parent")) {
        const children = await childrenOf(me.id)
        if (children.length > 0) visible.push({ student: { $in: children } })
      }
      filter.$or = visible
    }

    const files = await FileAsset.find(filter)
      .populate("owner", "name email avatar")
      .populate("course", "title code")
      .populate("student", "name")
      .sort({ createdAt: -1 })
      .limit(500)
      .lean()

    return json({ files })
  } catch (err) {
    return handleErrors(err)
  }
}

const metaSchema = z.object({
  context: z.enum(FILE_CONTEXTS),
  courseId: z.string().optional(),
  studentId: z.string().optional(),
  title: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  categoryPath: z.array(z.string()).max(6).default([]),
  tags: z.array(z.string()).max(20).default([]),
  visibility: z.enum(["private", "course", "school"]).default("private"),
  /** False makes the item readable online but not downloadable. */
  allowDownload: z.boolean().default(true),
})

/**
 * Placement checks shared by both ways of adding an item.
 *
 * Filing something into a class requires being in it, and sharing *with* a
 * class requires the same — otherwise `visibility: "course"` would be a way to
 * post into any classroom on the site.
 */
async function assertCanPlace(
  me: Awaited<ReturnType<typeof requireUser>>,
  meta: z.infer<typeof metaSchema>,
): Promise<void> {
  if (meta.courseId) {
    const scope = await courseScope(me)
    if (!scope.unrestricted && !scope.ids.includes(meta.courseId)) {
      throw new ApiError(403, "You don't have access to that class")
    }
    if (!(await Course.exists({ _id: meta.courseId }))) {
      throw new ApiError(404, "Class not found")
    }
  }
  if (meta.visibility === "course" && !meta.courseId) {
    throw new ApiError(400, "Choose a class to share this with")
  }
  // Only staff may publish to the whole school.
  if (meta.visibility === "school" && !hasRole(me, "teacher", "admin")) {
    throw new ApiError(403, "Only teachers and admins can publish to the whole school")
  }
}

const linkSchema = metaSchema.extend({
  url: z.string().min(1, "Paste the YouTube link"),
})

/**
 * POST /api/files
 *
 * Two shapes, one resource:
 *
 *  - `multipart/form-data` — upload a file. Fields: `file`, plus a `meta` part
 *    holding the JSON above. Metadata travels as one JSON part rather than a
 *    dozen form fields so the shape is validated in one place.
 *
 *  - `application/json` — add a YouTube video by link. Nothing is stored here
 *    beyond the video id; YouTube handles the hosting and streaming.
 *
 * Both land in the same collection so a media area is one list, with one set of
 * categories, permissions and filters, rather than two that have to be merged.
 */
export async function POST(req: Request) {
  try {
    const me = await requireUser()

    if ((req.headers.get("content-type") ?? "").includes("application/json")) {
      return await addYoutubeLink(req, me)
    }

    const form = await req.formData().catch(() => null)
    if (!form) throw new ApiError(400, "Send the upload as multipart/form-data")

    const file = form.get("file")
    if (!(file instanceof File)) throw new ApiError(400, "No file was included")
    if (file.size === 0) throw new ApiError(400, "That file is empty")
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new ApiError(413, `Files must be under ${Math.floor(MAX_UPLOAD_BYTES / 1024 / 1024)} MB`)
    }

    const contentType = file.type || "application/octet-stream"
    // Rejects video outright — see lib/storage/gridfs.ts. Checked here rather
    // than only in the browser, since the endpoint is reachable directly.
    assertAllowedType(contentType, file.name)

    const rawMeta = form.get("meta")
    const parsed = metaSchema.safeParse(
      typeof rawMeta === "string" ? JSON.parse(rawMeta) : { context: "media" },
    )
    if (!parsed.success) {
      throw new ApiError(400, parsed.error.issues.map((i) => i.message).join("; "))
    }
    const meta = parsed.data

    await assertCanPlace(me, meta)

    const bytes = Buffer.from(await file.arrayBuffer())
    const gridFsId = await saveFile(file.name, contentType, bytes)

    const asset = await FileAsset.create({
      kind: "file",
      filename: file.name,
      contentType,
      size: file.size,
      gridFsId,
      context: meta.context,
      owner: me.id,
      course: meta.courseId,
      student: meta.studentId,
      title: meta.title || file.name,
      description: meta.description,
      categoryPath: meta.categoryPath,
      tags: meta.tags,
      visibility: meta.visibility,
      allowDownload: meta.allowDownload,
    })

    return json(asset.toObject(), 201)
  } catch (err) {
    return handleErrors(err)
  }
}

/**
 * Add a YouTube video to a media area.
 *
 * The link is resolved to a video id and only the id is kept, so every shape of
 * YouTube URL a teacher might paste ends up stored identically and the player
 * builds a canonical embed from it.
 */
async function addYoutubeLink(
  req: Request,
  me: Awaited<ReturnType<typeof requireUser>>,
): Promise<Response> {
  const body = await parseBody(req, linkSchema)

  const videoId = youtubeVideoId(body.url)
  if (!videoId) {
    throw new ApiError(
      400,
      "That isn't a YouTube link. Paste the address from the video's page or its Share button.",
    )
  }

  await assertCanPlace(me, body)

  const asset = await FileAsset.create({
    kind: "youtube",
    youtubeId: videoId,
    // Kept populated so lists, sorting and search treat a video like anything
    // else. Size is zero because nothing of it is stored here.
    filename: body.title || `YouTube video ${videoId}`,
    contentType: "video/youtube",
    size: 0,
    context: body.context,
    owner: me.id,
    course: body.courseId,
    student: body.studentId,
    title: body.title || `YouTube video ${videoId}`,
    description: body.description,
    categoryPath: body.categoryPath,
    tags: body.tags,
    visibility: body.visibility,
    // Nothing to download — the video is streamed from YouTube.
    allowDownload: false,
  })

  return json(asset.toObject(), 201)
}
