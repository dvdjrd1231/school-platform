import { z } from "zod"

import { Discussion } from "@/lib/models"
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

/** GET /api/discussions/:id — one thread with replies. Counts the view. */
export async function GET(_req: Request, { params }: Params) {
  try {
    const me = await requireUser()
    const { id } = await params
    assertObjectId(id, "discussion id")

    const discussion = await Discussion.findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true })
      .populate("author", "name email avatar")
      .populate("course", "title code")
      .populate("replies.author", "name email avatar")
      .lean()
    if (!discussion) throw new ApiError(404, "Discussion not found")

    if (discussion.course) {
      const scope = await courseScope(me)
      if (!scope.unrestricted && !scope.ids.includes(String(discussion.course._id ?? discussion.course))) {
        throw new ApiError(403, "You don't have access to that course")
      }
    }

    return json(discussion)
  } catch (err) {
    return handleErrors(err)
  }
}

const updateSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  content: z.string().min(1).max(20_000).optional(),
  category: z.string().max(50).optional(),
  pinned: z.boolean().optional(),
  locked: z.boolean().optional(),
})

/**
 * PATCH /api/discussions/:id
 *
 * The author may edit the title, body and category. Pinning and locking are
 * moderation actions, so they need a teacher or admin.
 */
export async function PATCH(req: Request, { params }: Params) {
  try {
    const me = await requireUser()
    const { id } = await params
    assertObjectId(id, "discussion id")

    const discussion = await Discussion.findById(id)
    if (!discussion) throw new ApiError(404, "Discussion not found")

    const isAuthor = String(discussion.author) === me.id
    const isModerator = hasRole(me, "teacher", "admin")
    if (!isAuthor && !isModerator) {
      throw new ApiError(403, "Only the author can edit this discussion")
    }

    const body = await parseBody(req, updateSchema)
    if (!isModerator) {
      delete body.pinned
      delete body.locked
    }

    Object.assign(discussion, body)
    await discussion.save()

    return json(discussion.toObject())
  } catch (err) {
    return handleErrors(err)
  }
}

/** DELETE /api/discussions/:id — author or admin/teacher moderation. */
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const me = await requireUser()
    const { id } = await params
    assertObjectId(id, "discussion id")

    const discussion = await Discussion.findById(id)
    if (!discussion) throw new ApiError(404, "Discussion not found")

    if (String(discussion.author) !== me.id && !hasRole(me, "teacher", "admin")) {
      throw new ApiError(403, "Only the author or a teacher can delete this discussion")
    }

    await discussion.deleteOne()
    return json({ id, deleted: true })
  } catch (err) {
    return handleErrors(err)
  }
}
