import { z } from "zod"

import { Course, Discussion } from "@/lib/models"
import {
  ApiError,
  handleErrors,
  hasRole,
  json,
  parseBody,
  requireUser,
} from "@/lib/api/helpers"
import { courseFilter, courseScope } from "@/lib/api/scope"

export const runtime = "nodejs"

/** GET /api/discussions[?courseId=…] — threads the caller can see. */
export async function GET(req: Request) {
  try {
    const me = await requireUser()
    const courseId = new URL(req.url).searchParams.get("courseId")

    const scope = await courseScope(me)
    if (courseId && !scope.unrestricted && !scope.ids.includes(courseId)) {
      throw new ApiError(403, "You don't have access to that course")
    }

    const filter = courseId ? { course: courseId } : courseFilter(scope, { includeSchoolWide: true })

    const discussions = await Discussion.find(filter)
      .populate("author", "name email avatar")
      .populate("course", "title code")
      .populate("replies.author", "name email avatar")
      .sort({ pinned: -1, updatedAt: -1 })
      .lean()

    return json({ discussions })
  } catch (err) {
    return handleErrors(err)
  }
}

const createSchema = z.object({
  title: z.string().min(3).max(200),
  content: z.string().min(1).max(20_000),
  course: z.string().optional(),
  category: z.string().max(50).default("General"),
  pinned: z.boolean().default(false),
})

/**
 * POST /api/discussions — anyone signed in may start a thread.
 *
 * Students can only post into a course they're actually in; pinning is reserved
 * for teachers and admins.
 */
export async function POST(req: Request) {
  try {
    const me = await requireUser()
    const body = await parseBody(req, createSchema)

    if (body.course) {
      const scope = await courseScope(me)
      if (!scope.unrestricted && !scope.ids.includes(body.course)) {
        throw new ApiError(403, "You don't have access to that course")
      }
      const exists = await Course.exists({ _id: body.course })
      if (!exists) throw new ApiError(404, "Course not found")
    }

    if (body.pinned && !hasRole(me, "teacher", "admin")) body.pinned = false

    const discussion = await Discussion.create({ ...body, author: me.id })
    const populated = await Discussion.findById(discussion._id)
      .populate("author", "name email avatar")
      .populate("course", "title code")
      .lean()

    return json(populated, 201)
  } catch (err) {
    return handleErrors(err)
  }
}
