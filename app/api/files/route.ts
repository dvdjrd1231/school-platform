import { z } from "zod"

import { Course, FileAsset } from "@/lib/models"
import { FILE_CONTEXTS, type FileContext } from "@/lib/models/FileAsset"
import {
  ApiError,
  handleErrors,
  hasRole,
  json,
  requireUser,
} from "@/lib/api/helpers"
import { courseScope } from "@/lib/api/scope"
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
      filter.$or = [
        { owner: me.id },
        { visibility: "school" },
        { visibility: "course", course: { $in: scope.ids } },
      ]
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
})

/**
 * POST /api/files — multipart upload.
 *
 * Fields: `file` (required) plus a `meta` part holding the JSON above. Metadata
 * travels as one JSON part rather than a dozen form fields so the shape is
 * validated in one place.
 */
export async function POST(req: Request) {
  try {
    const me = await requireUser()

    const form = await req.formData().catch(() => null)
    if (!form) throw new ApiError(400, "Send the upload as multipart/form-data")

    const file = form.get("file")
    if (!(file instanceof File)) throw new ApiError(400, "No file was included")
    if (file.size === 0) throw new ApiError(400, "That file is empty")
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new ApiError(413, `Files must be under ${Math.floor(MAX_UPLOAD_BYTES / 1024 / 1024)} MB`)
    }

    const contentType = file.type || "application/octet-stream"
    assertAllowedType(contentType)

    const rawMeta = form.get("meta")
    const parsed = metaSchema.safeParse(
      typeof rawMeta === "string" ? JSON.parse(rawMeta) : { context: "media" },
    )
    if (!parsed.success) {
      throw new ApiError(400, parsed.error.issues.map((i) => i.message).join("; "))
    }
    const meta = parsed.data

    // Uploading into a class requires being in it. Sharing with a class requires
    // the same, otherwise "visibility: course" would be a way to post anywhere.
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

    const bytes = Buffer.from(await file.arrayBuffer())
    const gridFsId = await saveFile(file.name, contentType, bytes)

    const asset = await FileAsset.create({
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
    })

    return json(asset.toObject(), 201)
  } catch (err) {
    return handleErrors(err)
  }
}
