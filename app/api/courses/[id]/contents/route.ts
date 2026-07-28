import { Course } from "@/lib/models"
import {
  ApiError,
  assertObjectId,
  handleErrors,
  hasRole,
  json,
  requireUser,
} from "@/lib/api/helpers"
import { summariseCourseContents } from "@/lib/services/course-deletion"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

interface Params {
  params: Promise<{ id: string }>
}

/**
 * GET /api/courses/:id/contents — what deleting this class would destroy.
 *
 * The delete confirmation needs to name real numbers. "This will also delete 3
 * assignments and 42 submissions" is a decision someone can make; "are you
 * sure?" is not.
 */
export async function GET(_req: Request, { params }: Params) {
  try {
    const me = await requireUser()
    const { id } = await params
    assertObjectId(id, "course id")

    const course = await Course.findById(id).select("instructor title").lean()
    if (!course) throw new ApiError(404, "Course not found")

    if (String(course.instructor) !== me.id && !hasRole(me, "admin")) {
      throw new ApiError(403, "Only the course instructor or an admin can see this")
    }

    return json({ title: course.title, contents: await summariseCourseContents(id) })
  } catch (err) {
    return handleErrors(err)
  }
}
