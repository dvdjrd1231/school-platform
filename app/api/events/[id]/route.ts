import { z } from "zod"

import { CalendarEvent } from "@/lib/models"
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

const updateSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  description: z.string().max(5000).optional(),
  type: z.enum(["class", "assignment", "exam", "meeting", "holiday", "event"]).optional(),
  start: z.coerce.date().optional(),
  end: z.coerce.date().optional(),
  allDay: z.boolean().optional(),
  location: z.string().max(200).optional(),
})

/** PATCH /api/events/:id — the person who created it, or an admin. */
export async function PATCH(req: Request, { params }: Params) {
  try {
    const me = await requireUser()
    const { id } = await params
    assertObjectId(id, "event id")

    const event = await CalendarEvent.findById(id)
    if (!event) throw new ApiError(404, "Event not found")
    if (String(event.createdBy) !== me.id && !hasRole(me, "admin")) {
      throw new ApiError(403, "Only the organiser or an admin can change this event")
    }

    Object.assign(event, await parseBody(req, updateSchema))
    if (event.end && event.end < event.start) {
      throw new ApiError(400, "The end time can't be before the start time")
    }
    await event.save()

    return json(event.toObject())
  } catch (err) {
    return handleErrors(err)
  }
}

/** DELETE /api/events/:id — the person who created it, or an admin. */
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const me = await requireUser()
    const { id } = await params
    assertObjectId(id, "event id")

    const event = await CalendarEvent.findById(id)
    if (!event) throw new ApiError(404, "Event not found")
    if (String(event.createdBy) !== me.id && !hasRole(me, "admin")) {
      throw new ApiError(403, "Only the organiser or an admin can delete this event")
    }

    await event.deleteOne()
    return json({ id, deleted: true })
  } catch (err) {
    return handleErrors(err)
  }
}
