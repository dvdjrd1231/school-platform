import { Notification } from "@/lib/models"
import { handleErrors, json, requireUser } from "@/lib/api/helpers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/notifications — the current user's notifications, newest first.
 * Add ?unread=1 to count only unread. Always scoped to the caller.
 */
export async function GET(req: Request) {
  try {
    const me = await requireUser()
    const url = new URL(req.url)
    const limit = Math.min(Number(url.searchParams.get("limit") ?? 20), 50)

    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ user: me.id }).sort({ createdAt: -1 }).limit(limit).lean(),
      Notification.countDocuments({ user: me.id, isRead: false }),
    ])

    return json({ notifications, unreadCount })
  } catch (err) {
    return handleErrors(err)
  }
}

/** PATCH /api/notifications — mark all of the caller's notifications read. */
export async function PATCH() {
  try {
    const me = await requireUser()
    await Notification.updateMany({ user: me.id, isRead: false }, { isRead: true })
    return json({ ok: true })
  } catch (err) {
    return handleErrors(err)
  }
}
