import { z } from "zod"

import { Note } from "@/lib/models"
import { handleErrors, json, parseBody, requireUser } from "@/lib/api/helpers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** GET /api/notes[?courseId=…] — the caller's own notes. Never anyone else's. */
export async function GET(req: Request) {
  try {
    const me = await requireUser()
    const courseId = new URL(req.url).searchParams.get("courseId")

    const filter: Record<string, unknown> = { author: me.id }
    if (courseId) filter.course = courseId

    const notes = await Note.find(filter)
      .populate("course", "title code")
      .sort({ pinned: -1, updatedAt: -1 })
      .lean()

    return json({ notes })
  } catch (err) {
    return handleErrors(err)
  }
}

const createSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().max(50_000).default(""),
  course: z.string().optional(),
  tags: z.array(z.string().max(40)).max(20).default([]),
  pinned: z.boolean().default(false),
})

/** POST /api/notes — write a note. */
export async function POST(req: Request) {
  try {
    const me = await requireUser()
    const body = await parseBody(req, createSchema)

    const note = await Note.create({ ...body, author: me.id })
    return json(note.toObject(), 201)
  } catch (err) {
    return handleErrors(err)
  }
}
