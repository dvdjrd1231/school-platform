import { z } from "zod"

import { Announcement, Notification } from "@/lib/models"
import {
  ApiError,
  assertObjectId,
  handleErrors,
  hasRole,
  json,
  parseBody,
  requireUser,
} from "@/lib/api/helpers"
import { courseScope } from "@/lib/api/scope"

export const runtime = "nodejs"

interface Params {
  params: Promise<{ id: string }>
}

const replySchema = z.object({ body: z.string().min(1).max(5000) })

/**
 * POST /api/announcements/:id/replies — anyone who can see the announcement.
 *
 * The author is notified, unless they're replying to themselves.
 */
export async function POST(req: Request, { params }: Params) {
  try {
    const me = await requireUser()
    const { id } = await params
    assertObjectId(id, "announcement id")

    const announcement = await Announcement.findById(id)
    if (!announcement) throw new ApiError(404, "Announcement not found")

    // Replying implies reading: apply the same course check the list uses.
    if (announcement.course) {
      const scope = await courseScope(me)
      if (!scope.unrestricted && !scope.ids.includes(String(announcement.course))) {
        throw new ApiError(403, "You don't have access to that course")
      }
    }

    const { body } = await parseBody(req, replySchema)
    announcement.replies.push({ author: me.id as never, body, createdAt: new Date() })
    await announcement.save()

    if (String(announcement.author) !== me.id) {
      await Notification.create({
        user: announcement.author,
        title: "New reply to your announcement",
        message: `${me.name ?? "Someone"} replied to "${announcement.title}".`,
        type: "announcement",
        priority: "low",
        actionUrl: "/announcements",
        relatedId: announcement._id,
      })
    }

    const populated = await Announcement.findById(id)
      .populate("author", "name email avatar")
      .populate("replies.author", "name email avatar")
      .lean()

    return json(populated, 201)
  } catch (err) {
    return handleErrors(err)
  }
}

/**
 * DELETE /api/announcements/:id/replies?replyId=… — the reply's own author, the
 * announcement's author, or an admin.
 */
export async function DELETE(req: Request, { params }: Params) {
  try {
    const me = await requireUser()
    const { id } = await params
    assertObjectId(id, "announcement id")

    const replyId = new URL(req.url).searchParams.get("replyId")
    if (!replyId) throw new ApiError(400, "replyId is required")
    assertObjectId(replyId, "reply id")

    const announcement = await Announcement.findById(id)
    if (!announcement) throw new ApiError(404, "Announcement not found")

    const reply = announcement.replies.find((r) => String(r._id) === replyId)
    if (!reply) throw new ApiError(404, "Reply not found")

    const mayDelete =
      String(reply.author) === me.id ||
      String(announcement.author) === me.id ||
      hasRole(me, "admin")
    if (!mayDelete) throw new ApiError(403, "You can only delete your own replies")

    announcement.replies = announcement.replies.filter((r) => String(r._id) !== replyId)
    await announcement.save()

    return json({ id: replyId, deleted: true })
  } catch (err) {
    return handleErrors(err)
  }
}
