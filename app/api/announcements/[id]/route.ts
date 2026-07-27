import { z } from "zod"

import { Announcement } from "@/lib/models"
import {
  ApiError,
  assertObjectId,
  handleErrors,
  hasRole,
  json,
  parseBody,
  requireUser,
} from "@/lib/api/helpers"

export const runtime = "nodejs"

interface Params {
  params: Promise<{ id: string }>
}

/** GET /api/announcements/:id — a single announcement with its replies. */
export async function GET(_req: Request, { params }: Params) {
  try {
    await requireUser()
    const { id } = await params
    assertObjectId(id, "announcement id")

    const announcement = await Announcement.findById(id)
      .populate("author", "name email avatar")
      .populate("course", "title code")
      .populate("replies.author", "name email avatar")
      .lean()
    if (!announcement) throw new ApiError(404, "Announcement not found")

    return json(announcement)
  } catch (err) {
    return handleErrors(err)
  }
}

const updateSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  content: z.string().min(1).max(20_000).optional(),
  audience: z.enum(["all", "students", "teachers", "parents"]).optional(),
  priority: z.enum(["high", "medium", "low"]).optional(),
  pinned: z.boolean().optional(),
})

/** PATCH /api/announcements/:id — author or admin. */
export async function PATCH(req: Request, { params }: Params) {
  try {
    const me = await requireUser()
    const { id } = await params
    assertObjectId(id, "announcement id")

    const announcement = await Announcement.findById(id)
    if (!announcement) throw new ApiError(404, "Announcement not found")
    if (String(announcement.author) !== me.id && !hasRole(me, "admin")) {
      throw new ApiError(403, "Only the author or an admin can edit this announcement")
    }

    Object.assign(announcement, await parseBody(req, updateSchema))
    await announcement.save()

    return json(announcement.toObject())
  } catch (err) {
    return handleErrors(err)
  }
}

/** DELETE /api/announcements/:id — author or admin. Removes it and its replies. */
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const me = await requireUser()
    const { id } = await params
    assertObjectId(id, "announcement id")

    const announcement = await Announcement.findById(id)
    if (!announcement) throw new ApiError(404, "Announcement not found")
    if (String(announcement.author) !== me.id && !hasRole(me, "admin")) {
      throw new ApiError(403, "Only the author or an admin can delete this announcement")
    }

    await announcement.deleteOne()
    return json({ id, deleted: true })
  } catch (err) {
    return handleErrors(err)
  }
}
