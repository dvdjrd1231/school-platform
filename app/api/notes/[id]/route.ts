import { z } from "zod"

import { Note } from "@/lib/models"
import {
  ApiError,
  assertObjectId,
  handleErrors,
  json,
  parseBody,
  requireUser,
} from "@/lib/api/helpers"

export const runtime = "nodejs"

interface Params {
  params: Promise<{ id: string }>
}

/**
 * Every handler here scopes by author as well as id, so a note can only ever be
 * read or changed by the person who wrote it — including by an admin.
 */

/** GET /api/notes/:id */
export async function GET(_req: Request, { params }: Params) {
  try {
    const me = await requireUser()
    const { id } = await params
    assertObjectId(id, "note id")

    const note = await Note.findOne({ _id: id, author: me.id })
      .populate("course", "title code")
      .lean()
    if (!note) throw new ApiError(404, "Note not found")

    return json(note)
  } catch (err) {
    return handleErrors(err)
  }
}

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().max(50_000).optional(),
  course: z.string().nullable().optional(),
  tags: z.array(z.string().max(40)).max(20).optional(),
  pinned: z.boolean().optional(),
})

/** PATCH /api/notes/:id */
export async function PATCH(req: Request, { params }: Params) {
  try {
    const me = await requireUser()
    const { id } = await params
    assertObjectId(id, "note id")

    const body = await parseBody(req, updateSchema)
    const note = await Note.findOneAndUpdate({ _id: id, author: me.id }, body, {
      new: true,
      runValidators: true,
    }).lean()
    if (!note) throw new ApiError(404, "Note not found")

    return json(note)
  } catch (err) {
    return handleErrors(err)
  }
}

/** DELETE /api/notes/:id */
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const me = await requireUser()
    const { id } = await params
    assertObjectId(id, "note id")

    const note = await Note.findOneAndDelete({ _id: id, author: me.id }).lean()
    if (!note) throw new ApiError(404, "Note not found")

    return json({ id, deleted: true })
  } catch (err) {
    return handleErrors(err)
  }
}
