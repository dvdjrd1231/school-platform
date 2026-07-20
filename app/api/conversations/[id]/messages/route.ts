import { z } from "zod"

import { Conversation, Message, Notification } from "@/lib/models"
import {
  EVENTS,
  conversationChannel,
  publish,
  userChannel,
} from "@/lib/realtime/pusher"
import {
  ApiError,
  assertObjectId,
  handleErrors,
  json,
  parseBody,
  requireUser,
} from "@/lib/api/helpers"

export const runtime = "nodejs"

type Params = { params: Promise<{ id: string }> }

/** GET /api/conversations/:id/messages — paginated thread, oldest last. */
export async function GET(req: Request, { params }: Params) {
  try {
    const { id } = await params
    assertObjectId(id, "conversation id")
    const me = await requireUser()

    const conversation = await Conversation.findById(id)
    if (!conversation) throw new ApiError(404, "Conversation not found")
    assertParticipant(conversation.participants, me.id)

    const url = new URL(req.url)
    const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 100)
    const before = url.searchParams.get("before")

    const filter: Record<string, unknown> = { conversation: id }
    if (before) filter.createdAt = { $lt: new Date(before) }

    const messages = await Message.find(filter)
      .populate("sender", "name avatar roles")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()

    // Opening the thread clears the caller's unread badge.
    conversation.unreadCounts.set(me.id, 0)
    await conversation.save()

    return json({ messages: messages.reverse(), hasMore: messages.length === limit })
  } catch (err) {
    return handleErrors(err)
  }
}

const sendSchema = z.object({
  body: z.string().trim().min(1).max(10_000),
  attachments: z
    .array(z.object({ name: z.string(), url: z.string(), size: z.number().optional() }))
    .default([]),
})

/**
 * POST /api/conversations/:id/messages
 *
 * Persists first, then publishes. If the real-time publish fails the message is
 * still saved and will appear on the recipient's next fetch.
 */
export async function POST(req: Request, { params }: Params) {
  try {
    const { id } = await params
    assertObjectId(id, "conversation id")
    const me = await requireUser()
    const payload = await parseBody(req, sendSchema)

    const conversation = await Conversation.findById(id)
    if (!conversation) throw new ApiError(404, "Conversation not found")
    assertParticipant(conversation.participants, me.id)

    const message = await Message.create({
      conversation: id,
      sender: me.id,
      body: payload.body,
      attachments: payload.attachments,
      readBy: [me.id],
    })

    const recipients = conversation.participants
      .map(String)
      .filter((p) => p !== me.id)

    conversation.lastMessage = payload.body.slice(0, 200)
    conversation.lastMessageAt = new Date()
    for (const r of recipients) {
      conversation.unreadCounts.set(r, (conversation.unreadCounts.get(r) ?? 0) + 1)
    }
    await conversation.save()

    await message.populate("sender", "name avatar roles")
    const wire = message.toObject()

    await Promise.all([
      publish(conversationChannel(id), EVENTS.NEW_MESSAGE, wire),
      // Also hit each recipient's personal channel so inbox badges update even
      // when they don't have the thread open.
      publish(
        recipients.map(userChannel),
        EVENTS.NEW_MESSAGE,
        { conversationId: id, preview: conversation.lastMessage, from: me.name },
      ),
      Notification.insertMany(
        recipients.map((r) => ({
          user: r,
          title: `New message from ${me.name ?? "a user"}`,
          message: payload.body.slice(0, 140),
          type: "message",
          priority: "medium",
          actionUrl: `/messages/${id}`,
          relatedId: message._id,
        })),
      ),
    ])

    return json(wire, 201)
  } catch (err) {
    return handleErrors(err)
  }
}

function assertParticipant(participants: unknown[], userId: string): void {
  if (!participants.map(String).includes(userId)) {
    throw new ApiError(403, "You are not a participant in this conversation")
  }
}
