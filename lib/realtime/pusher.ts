import Pusher from "pusher"

/**
 * Server-side real-time publishing.
 *
 * Vercel's serverless functions cannot hold WebSocket connections, so a managed
 * service handles the socket layer. Everything here goes through `publish()`,
 * which is the single seam to swap for raw Socket.IO if the app later moves to
 * a long-running Node host.
 */

let client: Pusher | null = null

function getClient(): Pusher | null {
  const { PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER } = process.env
  if (!PUSHER_APP_ID || !PUSHER_KEY || !PUSHER_SECRET || !PUSHER_CLUSTER) return null

  client ??= new Pusher({
    appId: PUSHER_APP_ID,
    key: PUSHER_KEY,
    secret: PUSHER_SECRET,
    cluster: PUSHER_CLUSTER,
    useTLS: true,
  })
  return client
}

/** Private per-user channel. Authorised in /api/pusher/auth. */
export function userChannel(userId: string): string {
  return `private-user-${userId}`
}

export function conversationChannel(conversationId: string): string {
  return `private-conversation-${conversationId}`
}

export const EVENTS = {
  NEW_MESSAGE: "new-message",
  MESSAGE_READ: "message-read",
  NOTIFICATION: "notification",
} as const

/**
 * Publish an event. Never throws: a real-time delivery failure must not fail
 * the HTTP request that already persisted the message to MongoDB. Clients
 * re-fetch on mount, so a dropped event degrades to "not instant", not "lost".
 */
export async function publish(
  channel: string | string[],
  event: string,
  payload: unknown,
): Promise<void> {
  const pusher = getClient()
  if (!pusher) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[realtime] Pusher not configured; skipped ${event}`)
    }
    return
  }

  try {
    await pusher.trigger(channel, event, payload)
  } catch (err) {
    console.error("[realtime] publish failed:", err)
  }
}

export function isRealtimeConfigured(): boolean {
  return getClient() !== null
}
