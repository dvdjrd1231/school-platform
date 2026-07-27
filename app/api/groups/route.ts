import { z } from "zod"

import { Course, Group } from "@/lib/models"
import { ApiError, handleErrors, json, parseBody, requireUser } from "@/lib/api/helpers"
import { courseFilter, courseScope } from "@/lib/api/scope"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** GET /api/groups[?courseId=…] — groups in classes the caller belongs to. */
export async function GET(req: Request) {
  try {
    const me = await requireUser()
    const courseId = new URL(req.url).searchParams.get("courseId")

    const scope = await courseScope(me)
    if (courseId && !scope.unrestricted && !scope.ids.includes(courseId)) {
      throw new ApiError(403, "You don't have access to that class")
    }

    const filter = courseId ? { course: courseId } : courseFilter(scope)

    const groups = await Group.find(filter)
      .populate("members", "name email avatar")
      .populate("createdBy", "name")
      .populate("course", "title code")
      .sort({ createdAt: -1 })
      .lean()

    return json({
      groups: groups.map((g) => ({
        ...g,
        memberCount: g.members.length,
        isMember: g.members.some((m) => String((m as { _id: unknown })._id) === me.id),
        isOwner: String((g.createdBy as { _id?: unknown })?._id ?? g.createdBy) === me.id,
      })),
    })
  } catch (err) {
    return handleErrors(err)
  }
}

const createSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(2000).optional(),
  course: z.string(),
  maxMembers: z.number().int().min(0).max(200).default(0),
  joinPolicy: z.enum(["open", "closed"]).default("open"),
})

/**
 * POST /api/groups — anyone in a class may start a group in it.
 *
 * The creator is its first member, so a group is never left with nobody in it.
 */
export async function POST(req: Request) {
  try {
    const me = await requireUser()
    const body = await parseBody(req, createSchema)

    const scope = await courseScope(me)
    if (!scope.unrestricted && !scope.ids.includes(body.course)) {
      throw new ApiError(403, "You don't have access to that class")
    }
    if (!(await Course.exists({ _id: body.course }))) {
      throw new ApiError(404, "Class not found")
    }

    const group = await Group.create({ ...body, createdBy: me.id, members: [me.id] })
    const populated = await Group.findById(group._id)
      .populate("members", "name email avatar")
      .populate("course", "title code")
      .lean()

    return json(populated, 201)
  } catch (err) {
    return handleErrors(err)
  }
}
