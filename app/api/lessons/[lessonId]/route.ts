import { z } from "zod"
import { Types, type HydratedDocument } from "mongoose"

import { Course, Enrollment, type ICourse, type IModule } from "@/lib/models"
import {
  ApiError,
  assertObjectId,
  handleErrors,
  hasRole,
  json,
  parseBody,
  requireUser,
  type SessionUser,
} from "@/lib/api/helpers"
import { findLesson, isUnlocked, orderedLessons } from "@/lib/services/lessons"

export const runtime = "nodejs"

interface Params {
  params: Promise<{ lessonId: string }>
}

/**
 * GET /api/lessons/:lessonId
 *
 * The lesson itself plus everything the viewer needs: its course/module, whether
 * the student has unlocked and completed it, and the neighbouring lessons so the
 * page can offer "previous"/"next" without a second request.
 */
export async function GET(_req: Request, { params }: Params) {
  try {
    const me = await requireUser()
    const { lessonId } = await params
    assertObjectId(lessonId, "lesson id")

    const found = await findLesson(lessonId)
    if (!found) throw new ApiError(404, "Lesson not found")

    const { course, module, lesson, index } = found
    const flat = orderedLessons(course)

    const enrollment = await Enrollment.findOne({ student: me.id, course: course._id }).lean()
    const isStaff = hasRole(me, "admin") || String(course.instructor) === me.id
    if (!isStaff && !enrollment) throw new ApiError(403, "You are not enrolled in this course")

    const completed = new Set((enrollment?.completedLessons ?? []).map(String))
    // Staff always see everything; students walk the sequence.
    const unlocked = isStaff || isUnlocked(flat, index, completed)

    const neighbour = (i: number) =>
      i >= 0 && i < flat.length
        ? { lessonId: String(flat[i].lesson._id), title: flat[i].lesson.title }
        : null

    return json({
      lesson: { ...lesson, _id: String(lesson._id) },
      module: { _id: String(module._id), title: module.title },
      course: { _id: String(course._id), title: course.title, code: course.code },
      position: { index, total: flat.length },
      previous: neighbour(index - 1),
      next: neighbour(index + 1),
      completed: completed.has(lessonId),
      unlocked,
      canEdit: isStaff,
    })
  } catch (err) {
    return handleErrors(err)
  }
}

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  type: z.enum(["video", "reading", "interactive", "quiz", "assignment"]).optional(),
  duration: z.string().optional(),
  content: z.string().max(100_000).optional(),
  // "" clears the video; a URL sets it.
  videoUrl: z.union([z.string().url(), z.literal("")]).optional(),
  order: z.number().int().min(0).optional(),
  materials: z
    .array(z.object({ name: z.string(), url: z.string(), size: z.number().optional() }))
    .optional(),
  /** Move the lesson to another course. Requires rights on both. */
  moveToCourseId: z.string().optional(),
  /** Move within (or into) a module. Combined with moveToCourseId when both change. */
  moveToModuleId: z.string().optional(),
  /** Create-and-move: used when the destination course has no suitable module. */
  moveToModuleTitle: z.string().optional(),
})

/** PATCH /api/lessons/:lessonId — edit, reorder, or reassign to another class. */
export async function PATCH(req: Request, { params }: Params) {
  try {
    const me = await requireUser()
    const { lessonId } = await params
    assertObjectId(lessonId, "lesson id")

    const found = await findLesson(lessonId)
    if (!found) throw new ApiError(404, "Lesson not found")
    assertCanEdit(me, found.course.instructor)

    const body = await parseBody(req, updateSchema)
    const { moveToCourseId, moveToModuleId, moveToModuleTitle, ...fields } = body

    // Apply the plain field edits first — they travel with the lesson if it moves.
    Object.assign(found.lesson, fields)
    if (fields.videoUrl === "") found.lesson.videoUrl = undefined

    const movingCourse = moveToCourseId && moveToCourseId !== String(found.course._id)
    const movingModule = moveToModuleId && moveToModuleId !== String(found.module._id)

    if (!movingCourse && !movingModule) {
      await found.course.save()
      return json({ lessonId, moved: false })
    }

    // A move is a detach-then-attach; snapshot the lesson before removing it.
    const snapshot = JSON.parse(JSON.stringify(found.lesson)) as Record<string, unknown>
    found.module.lessons = found.module.lessons.filter((l) => String(l._id) !== lessonId)

    const target = movingCourse ? await Course.findById(moveToCourseId) : found.course
    if (!target) throw new ApiError(404, "Destination course not found")
    if (movingCourse) assertCanEdit(me, target.instructor)

    const destination = resolveModule(target, moveToModuleId, moveToModuleTitle)
    const nextOrder = destination.lessons.reduce((max, l) => Math.max(max, l.order ?? 0), -1) + 1
    destination.lessons.push({ ...snapshot, _id: new Types.ObjectId(lessonId), order: nextOrder } as never)

    if (movingCourse) {
      await found.course.save()
      await target.save()
      // Progress in the old course counted this lesson; drop those stale marks.
      await Enrollment.updateMany(
        { course: found.course._id },
        { $pull: { completedLessons: new Types.ObjectId(lessonId) } },
      )
    } else {
      await target.save()
    }

    return json({
      lessonId,
      moved: true,
      courseId: String(target._id),
      moduleId: String(destination._id),
    })
  } catch (err) {
    return handleErrors(err)
  }
}

/** DELETE /api/lessons/:lessonId — removes it and any completion marks for it. */
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const me = await requireUser()
    const { lessonId } = await params
    assertObjectId(lessonId, "lesson id")

    const found = await findLesson(lessonId)
    if (!found) throw new ApiError(404, "Lesson not found")
    assertCanEdit(me, found.course.instructor)

    found.module.lessons = found.module.lessons.filter((l) => String(l._id) !== lessonId)
    await found.course.save()

    await Enrollment.updateMany(
      { course: found.course._id },
      { $pull: { completedLessons: new Types.ObjectId(lessonId) } },
    )

    return json({ lessonId, deleted: true })
  } catch (err) {
    return handleErrors(err)
  }
}

function assertCanEdit(me: SessionUser, instructor: unknown): void {
  if (String(instructor) !== me.id && !hasRole(me, "admin")) {
    throw new ApiError(403, "Only the course instructor or an admin can change this lesson")
  }
}

/** Find the destination module, falling back to creating/reusing one by title. */
function resolveModule(
  course: HydratedDocument<ICourse>,
  moduleId?: string,
  moduleTitle?: string,
): IModule {
  const byId = moduleId ? course.modules.find((m) => String(m._id) === moduleId) : undefined
  if (byId) return byId

  const title = moduleTitle?.trim() || "General"
  const existing = course.modules.find((m) => m.title === title)
  if (existing) return existing

  course.modules.push({ title, order: course.modules.length, status: "available", lessons: [] } as never)
  return course.modules[course.modules.length - 1]
}
