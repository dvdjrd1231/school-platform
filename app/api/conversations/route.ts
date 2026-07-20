import { z } from "zod"

import { Conversation, User } from "@/lib/models"
import { ApiError, handleErrors, json, parseBody, requireUser } from "@/lib/api/helpers"

export const runtime = "nodejs"

/** GET /api/conversations — the caller's inbox, most recent first. */
export async function GET() {
  try {
    const me = await requireUser()

    const conversations = await Conversation.find({ participants: me.id })
      .populate("participants", "name email avatar roles")
      .populate("regardingStudent", "name studentId")
      .populate("course", "title code")
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .lean()

    return json({
      conversations: conversations.map((c) => ({
        ...c,
        // Map is serialised as a plain object by .lean(); read defensively.
        unreadCount: (c.unreadCounts as unknown as Record<string, number>)?.[me.id] ?? 0,
      })),
    })
  } catch (err) {
    return handleErrors(err)
  }
}

const createSchema = z.object({
  participantIds: z.array(z.string()).min(1).max(20),
  subject: z.string().max(200).optional(),
  regardingStudent: z.string().optional(),
  course: z.string().optional(),
})

/**
 * POST /api/conversations — start a thread.
 *
 * Parents may only open threads with staff, and only about a student they are a
 * guardian for. Without that check a parent account could message arbitrary
 * students directly.
 */
export async function POST(req: Request) {
  try {
    const me = await requireUser()
    const body = await parseBody(req, createSchema)

    const participants = Array.from(new Set([...body.participantIds, me.id]))
    if (participants.length < 2) {
      throw new ApiError(400, "A conversation needs at least one other participant")
    }

    const others = await User.find({ _id: { $in: body.participantIds } })
      .select("roles status")
      .lean()
    if (others.length !== body.participantIds.length) {
      throw new ApiError(404, "One or more participants were not found")
    }

    const iAmParent = me.roles.includes("parent") && !me.roles.includes("admin")
    if (iAmParent) {
      const allStaff = others.every(
        (u) => u.roles.includes("teacher") || u.roles.includes("admin"),
      )
      if (!allStaff) {
        throw new ApiError(403, "Parents may only start conversations with teachers or staff")
      }
      if (body.regardingStudent) {
        const parent = await User.findById(me.id).select("children").lean()
        const isGuardian = parent?.children?.some((c) => String(c) === body.regardingStudent)
        if (!isGuardian) {
          throw new ApiError(403, "You are not listed as a guardian for that student")
        }
      }
    }

    const conversation = await Conversation.create({
      participants,
      subject: body.subject,
      regardingStudent: body.regardingStudent,
      course: body.course,
      unreadCounts: new Map(participants.map((p) => [p, 0])),
    })

    await conversation.populate("participants", "name email avatar roles")
    return json(conversation.toObject(), 201)
  } catch (err) {
    return handleErrors(err)
  }
}
