import { z } from "zod"

import { Discussion, Notification } from "@/lib/models"
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

const createSchema = z.object({ body: z.string().min(1).max(10_000) })

/** POST /api/discussions/:id/replies — post a reply and notify the thread author. */
export async function POST(req: Request, { params }: Params) {
  try {
    const me = await requireUser()
    const { id } = await params
    assertObjectId(id, "discussion id")

    const discussion = await Discussion.findById(id)
    if (!discussion) throw new ApiError(404, "Discussion not found")
    if (discussion.locked) throw new ApiError(409, "This discussion is locked")

    if (discussion.course) {
      const scope = await courseScope(me)
      if (!scope.unrestricted && !scope.ids.includes(String(discussion.course))) {
        throw new ApiError(403, "You don't have access to that course")
      }
    }

    const { body } = await parseBody(req, createSchema)
    discussion.replies.push({ author: me.id as never, body, createdAt: new Date() })
    await discussion.save()

    if (String(discussion.author) !== me.id) {
      await Notification.create({
        user: discussion.author,
        title: "New reply to your discussion",
        message: `${me.name ?? "Someone"} replied to "${discussion.title}".`,
        type: "discussion",
        priority: "low",
        actionUrl: `/discussions/${discussion._id}`,
        relatedId: discussion._id,
      })
    }

    const populated = await Discussion.findById(id)
      .populate("author", "name email avatar")
      .populate("replies.author", "name email avatar")
      .lean()

    return json(populated, 201)
  } catch (err) {
    return handleErrors(err)
  }
}

const editSchema = z.object({ replyId: z.string(), body: z.string().min(1).max(10_000) })

/** PATCH /api/discussions/:id/replies — edit your own reply. */
export async function PATCH(req: Request, { params }: Params) {
  try {
    const me = await requireUser()
    const { id } = await params
    assertObjectId(id, "discussion id")

    const { replyId, body } = await parseBody(req, editSchema)
    assertObjectId(replyId, "reply id")

    const discussion = await Discussion.findById(id)
    if (!discussion) throw new ApiError(404, "Discussion not found")

    const reply = discussion.replies.find((r) => String(r._id) === replyId)
    if (!reply) throw new ApiError(404, "Reply not found")
    if (String(reply.author) !== me.id) throw new ApiError(403, "You can only edit your own replies")

    reply.body = body
    reply.editedAt = new Date()
    await discussion.save()

    return json({ replyId, edited: true })
  } catch (err) {
    return handleErrors(err)
  }
}

/** DELETE /api/discussions/:id/replies?replyId=… — own reply, or moderation. */
export async function DELETE(req: Request, { params }: Params) {
  try {
    const me = await requireUser()
    const { id } = await params
    assertObjectId(id, "discussion id")

    const replyId = new URL(req.url).searchParams.get("replyId")
    if (!replyId) throw new ApiError(400, "replyId is required")
    assertObjectId(replyId, "reply id")

    const discussion = await Discussion.findById(id)
    if (!discussion) throw new ApiError(404, "Discussion not found")

    const reply = discussion.replies.find((r) => String(r._id) === replyId)
    if (!reply) throw new ApiError(404, "Reply not found")

    if (String(reply.author) !== me.id && !hasRole(me, "teacher", "admin")) {
      throw new ApiError(403, "You can only delete your own replies")
    }

    discussion.replies = discussion.replies.filter((r) => String(r._id) !== replyId)
    await discussion.save()

    return json({ replyId, deleted: true })
  } catch (err) {
    return handleErrors(err)
  }
}
