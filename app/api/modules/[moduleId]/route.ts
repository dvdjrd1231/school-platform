import { Course, Enrollment } from "@/lib/models"
import {
  ApiError,
  assertObjectId,
  handleErrors,
  hasRole,
  json,
  requireUser,
} from "@/lib/api/helpers"
import { isUnlocked, orderedLessons } from "@/lib/services/lessons"

export const runtime = "nodejs"

interface Params {
  params: Promise<{ moduleId: string }>
}

/**
 * GET /api/modules/:moduleId
 *
 * One module of a course with its lessons, the caller's completion of them, and
 * the neighbouring modules for previous/next navigation. Modules are embedded in
 * courses, so this looks the parent course up by the module's id.
 */
export async function GET(_req: Request, { params }: Params) {
  try {
    const me = await requireUser()
    const { moduleId } = await params
    assertObjectId(moduleId, "module id")

    const course = await Course.findOne({ "modules._id": moduleId })
      .populate("instructor", "name")
      .lean()
    if (!course) throw new ApiError(404, "Module not found")

    const modules = [...(course.modules ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    const position = modules.findIndex((m) => String(m._id) === moduleId)
    if (position === -1) throw new ApiError(404, "Module not found")

    const instructorId = String(
      (course.instructor as { _id?: unknown })?._id ?? course.instructor,
    )
    const canEdit = instructorId === me.id || hasRole(me, "admin")

    const enrollment = await Enrollment.findOne({ student: me.id, course: course._id })
      .select("completedLessons")
      .lean()
    if (!canEdit && !enrollment) throw new ApiError(403, "You are not enrolled in this course")

    const completed = new Set((enrollment?.completedLessons ?? []).map(String))
    const flat = orderedLessons(course)

    const module = modules[position]
    const lessons = [...(module.lessons ?? [])]
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((lesson) => {
        const index = flat.findIndex((e) => String(e.lesson._id) === String(lesson._id))
        return {
          ...lesson,
          _id: String(lesson._id),
          completed: completed.has(String(lesson._id)),
          unlocked: canEdit || isUnlocked(flat, index, completed),
        }
      })

    const sibling = (i: number) =>
      modules[i] ? { _id: String(modules[i]._id), title: modules[i].title } : null

    return json({
      module: { _id: String(module._id), title: module.title, description: module.description },
      course: { _id: String(course._id), title: course.title, code: course.code },
      lessons,
      previous: sibling(position - 1),
      next: sibling(position + 1),
      canEdit,
    })
  } catch (err) {
    return handleErrors(err)
  }
}
