import { z } from "zod"

import { FileAsset } from "@/lib/models"
import {
  ApiError,
  assertObjectId,
  handleErrors,
  hasRole,
  json,
  parseBody,
  requireUser,
} from "@/lib/api/helpers"
import { canReadFile, canWriteFile } from "@/lib/services/file-access"
import { deleteFile } from "@/lib/storage/gridfs"

export const runtime = "nodejs"

interface Params {
  params: Promise<{ id: string }>
}

/** GET /api/files/:id — metadata for one file (the preview panel). */
export async function GET(_req: Request, { params }: Params) {
  try {
    const me = await requireUser()
    const { id } = await params
    assertObjectId(id, "file id")

    const file = await FileAsset.findById(id)
      .populate("owner", "name email avatar")
      .populate("course", "title code")
    if (!file) throw new ApiError(404, "File not found")
    if (!(await canReadFile(me, file))) throw new ApiError(403, "You can't view this file")

    return json(file.toObject())
  } catch (err) {
    return handleErrors(err)
  }
}

const updateSchema = z.object({
  title: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  categoryPath: z.array(z.string()).max(6).optional(),
  tags: z.array(z.string()).max(20).optional(),
  visibility: z.enum(["private", "course", "school"]).optional(),
  allowDownload: z.boolean().optional(),
})

/** PATCH /api/files/:id — rename, re-file, or change who can see it. */
export async function PATCH(req: Request, { params }: Params) {
  try {
    const me = await requireUser()
    const { id } = await params
    assertObjectId(id, "file id")

    const file = await FileAsset.findById(id)
    if (!file) throw new ApiError(404, "File not found")
    if (!canWriteFile(me, file)) throw new ApiError(403, "You can only change your own files")

    const body = await parseBody(req, updateSchema)
    if (body.visibility === "course" && !file.course) {
      throw new ApiError(400, "This file isn't attached to a class, so it can't be shared with one")
    }
    if (body.visibility === "school" && !hasRole(me, "teacher", "admin")) {
      throw new ApiError(403, "Only teachers and admins can publish to the whole school")
    }

    Object.assign(file, body)
    await file.save()

    return json(file.toObject())
  } catch (err) {
    return handleErrors(err)
  }
}

/** DELETE /api/files/:id — removes the record and the stored bytes. */
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const me = await requireUser()
    const { id } = await params
    assertObjectId(id, "file id")

    const file = await FileAsset.findById(id)
    if (!file) throw new ApiError(404, "File not found")
    if (!canWriteFile(me, file)) throw new ApiError(403, "You can only delete your own files")

    // Bytes first: a leftover record with no bytes is a broken row a user can
    // retry, whereas orphaned bytes are invisible and never cleaned up. A
    // YouTube item has no bytes of ours to remove — deleting it unlists the
    // video here and leaves it untouched on YouTube, which is the intent.
    if (file.gridFsId) await deleteFile(file.gridFsId)
    await file.deleteOne()

    return json({ id, deleted: true })
  } catch (err) {
    return handleErrors(err)
  }
}
