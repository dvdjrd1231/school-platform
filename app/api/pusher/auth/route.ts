import Pusher from "pusher"

import { Conversation } from "@/lib/models"
import { ApiError, handleErrors, requireUser } from "@/lib/api/helpers"

export const runtime = "nodejs"

/**
 * POST /api/pusher/auth — private channel authorisation.
 *
 * Pusher calls this before granting a subscription. Without the ownership
 * checks below, any authenticated user could subscribe to
 * `private-user-<someone-else>` and read their messages in real time.
 */
export async function POST(req: Request) {
  try {
    const me = await requireUser()

    const form = await req.formData()
    const socketId = String(form.get("socket_id") ?? "")
    const channel = String(form.get("channel_name") ?? "")
    if (!socketId || !channel) throw new ApiError(400, "socket_id and channel_name are required")

    await assertCanSubscribe(channel, me.id)

    const { PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER } = process.env
    if (!PUSHER_APP_ID || !PUSHER_KEY || !PUSHER_SECRET || !PUSHER_CLUSTER) {
      throw new ApiError(503, "Real-time messaging is not configured on this server")
    }

    const pusher = new Pusher({
      appId: PUSHER_APP_ID,
      key: PUSHER_KEY,
      secret: PUSHER_SECRET,
      cluster: PUSHER_CLUSTER,
      useTLS: true,
    })

    const auth = pusher.authorizeChannel(socketId, channel)
    return Response.json(auth)
  } catch (err) {
    return handleErrors(err)
  }
}

async function assertCanSubscribe(channel: string, userId: string): Promise<void> {
  if (channel === `private-user-${userId}`) return

  if (channel.startsWith("private-conversation-")) {
    const conversationId = channel.replace("private-conversation-", "")
    const isParticipant = await Conversation.exists({
      _id: conversationId,
      participants: userId,
    })
    if (isParticipant) return
    throw new ApiError(403, "You are not a participant in that conversation")
  }

  throw new ApiError(403, "Not permitted to subscribe to that channel")
}
