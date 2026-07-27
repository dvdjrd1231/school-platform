import { z } from "zod"

import { Enrollment, Notification, User } from "@/lib/models"
import {
  ApiError,
  handleErrors,
  json,
  parseBody,
  requireRole,
  requireUser,
} from "@/lib/api/helpers"
import type { UserRole } from "@/lib/models/User"

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

const broadcastSchema = z.object({
  title: z.string().min(2).max(200),
  message: z.string().min(1).max(2000),
  /** "all" reaches every active account. */
  audience: z.enum(["all", "student", "teacher", "parent", "admin", "course"]).default("all"),
  /** Required when audience is "course". */
  courseId: z.string().optional(),
  priority: z.enum(["high", "medium", "low"]).default("medium"),
  actionUrl: z.string().max(500).optional(),
})

/**
 * POST /api/notifications — admin broadcast.
 *
 * Sends a notification to a role, a class, or everyone. Capped at 5,000
 * recipients per send so one click can't queue an unbounded write.
 */
export async function POST(req: Request) {
  try {
    await requireRole("admin")
    const body = await parseBody(req, broadcastSchema)

    let recipients: string[]

    if (body.audience === "course") {
      if (!body.courseId) throw new ApiError(400, "Choose a class to send to")
      const enrollments = await Enrollment.find({ course: body.courseId, status: "active" })
        .select("student")
        .lean()
      recipients = enrollments.map((e) => String(e.student))
    } else {
      const filter =
        body.audience === "all"
          ? { status: "active" as const }
          : { status: "active" as const, roles: body.audience as UserRole }
      const users = await User.find(filter).select("_id").limit(5000).lean()
      recipients = users.map((u) => String(u._id))
    }

    if (recipients.length === 0) {
      throw new ApiError(409, "Nobody matches that audience")
    }

    await Notification.insertMany(
      recipients.map((user) => ({
        user,
        title: body.title,
        message: body.message,
        type: "system",
        priority: body.priority,
        actionUrl: body.actionUrl,
      })),
    )

    return json({ sent: recipients.length }, 201)
  } catch (err) {
    return handleErrors(err)
  }
}
