import { z } from "zod"
import { Types, type HydratedDocument } from "mongoose"

import { Assignment, Course, Enrollment, Quiz, type ICourse, type IModule } from "@/lib/models"
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
import { findLesson, isUnlocked, orderedLessons, visibleToStudents } from "@/lib/services/lessons"
import { normaliseLesson } from "@/lib/lessons/normalise"
import { lessonBodySchema } from "@/lib/lessons/schemas"
import { applyLessonBody, captureLinks, retireOrphanedLinks } from "@/lib/lessons/persist"

export const runtime = "nodejs"

interface Params {
  params: Promise<{ lessonId: string }>
}

/**
 * GET /api/lessons/:lessonId
 *
 * The lesson in its typed shape, plus everything the viewer needs: its
 * course/module, whether the student has unlocked and completed it, the
 * neighbouring lessons, and — for quiz and assignment lessons — the linked
 * record so the page doesn't need a second round trip.
 */
export async function GET(_req: Request, { params }: Params) {
  try {
    const me = await requireUser()
    const { lessonId } = await params
    assertObjectId(lessonId, "lesson id")

    const found = await findLesson(lessonId)
    if (!found) throw new ApiError(404, "Lesson not found")

    const { course, module, lesson, index } = found
    const enrollment = await Enrollment.findOne({ student: me.id, course: course._id }).lean()
    const isStaff = hasRole(me, "admin") || String(course.instructor) === me.id
    if (!isStaff && !enrollment) throw new ApiError(403, "You are not enrolled in this course")

    const normalised = normaliseLesson(lesson)

    // A draft, or one not yet released, doesn't exist as far as a student is
    // concerned — 404 rather than 403, so its title isn't leaked either.
    if (!isStaff && !visibleToStudents(normalised)) {
      throw new ApiError(404, "Lesson not found")
    }

    // Students walk published lessons in order; staff see the lot.
    const flat = orderedLessons(course, { publishedOnly: !isStaff })
    const position = flat.findIndex((e) => String(e.lesson._id) === lessonId)
    const completed = new Set((enrollment?.completedLessons ?? []).map(String))
    const unlocked = isStaff || isUnlocked(flat, position, completed)

    const neighbour = (i: number) =>
      i >= 0 && i < flat.length
        ? { lessonId: String(flat[i].lesson._id), title: flat[i].lesson.title }
        : null

    // Only send the linked record when the lesson is actually of that type —
    // otherwise a stale reference would surface settings the lesson no longer has.
    const quiz =
      normalised.type === "quiz" && normalised.quiz?.quizId
        ? await Quiz.findById(normalised.quiz.quizId)
            .select("title status questions timeLimit attemptsAllowed passingScore instructions")
            .lean()
        : null

    const assignment =
      normalised.type === "assignment" && normalised.assignment?.assignmentId
        ? await Assignment.findById(normalised.assignment.assignmentId).lean()
        : null

    return json({
      lesson: normalised,
      module: { _id: String(module._id), title: module.title },
      course: { _id: String(course._id), title: course.title, code: course.code },
      position: { index: position === -1 ? index : position, total: flat.length },
      previous: neighbour(position - 1),
      next: neighbour(position + 1),
      completed: completed.has(lessonId),
      unlocked,
      canEdit: isStaff,
      linked: {
        quiz: quiz
          ? {
              _id: String(quiz._id),
              title: quiz.title,
              status: quiz.status,
              questionCount: quiz.questions.length,
              totalPoints: quiz.questions.reduce((sum, q) => sum + q.points, 0),
              timeLimit: quiz.timeLimit,
              attemptsAllowed: quiz.attemptsAllowed,
              passingScore: quiz.passingScore,
              instructions: quiz.instructions,
            }
          : null,
        assignment: assignment ? { ...assignment, _id: String(assignment._id) } : null,
      },
    })
  } catch (err) {
    return handleErrors(err)
  }
}

/** Where a lesson can be moved to. Merged with the type-specific body. */
const moveSchema = z.object({
  /** Move the lesson to another course. Requires rights on both. */
  moveToCourseId: z.string().optional(),
  /** Move within (or into) a module. */
  moveToModuleId: z.string().optional(),
  /** Create-and-move, when the destination has no suitable module. */
  moveToModuleTitle: z.string().optional(),
  /** Reposition within the module. */
  order: z.number().int().min(0).optional(),
})

const updateSchema = z.intersection(moveSchema, lessonBodySchema)

/**
 * PATCH /api/lessons/:lessonId — edit, reorder, or reassign to another class.
 *
 * The whole lesson is replaced from a type-specific body rather than patched
 * field by field. That is what guarantees the client's requirement that
 * changing a lesson's type cannot leave the previous type's data behind: the
 * schema drops foreign fields, and applyLessonBody clears the stored payloads.
 */
export async function PATCH(req: Request, { params }: Params) {
  try {
    const me = await requireUser()
    const { lessonId } = await params
    assertObjectId(lessonId, "lesson id")

    const found = await findLesson(lessonId)
    if (!found) throw new ApiError(404, "Lesson not found")
    assertCanEdit(me, found.course.instructor)

    const body = await parseBody(req, updateSchema)
    const { moveToCourseId, moveToModuleId, moveToModuleTitle, order, ...lessonBody } = body

    const previousLinks = captureLinks(found.lesson)

    await applyLessonBody(found.lesson, lessonBody, {
      course: found.course,
      authorId: me.id,
      lessonId: new Types.ObjectId(lessonId),
    })
    if (order !== undefined) found.lesson.order = order

    await retireOrphanedLinks(previousLinks, captureLinks(found.lesson))

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
    destination.lessons.push({
      ...snapshot,
      _id: new Types.ObjectId(lessonId),
      order: nextOrder,
    } as never)

    if (movingCourse) {
      await found.course.save()
      await target.save()
      // Progress in the old course counted this lesson; drop those stale marks.
      await Enrollment.updateMany(
        { course: found.course._id },
        { $pull: { completedLessons: new Types.ObjectId(lessonId) } },
      )
      // The linked records belong to the class, not just the lesson.
      await Quiz.updateMany({ lesson: lessonId }, { $set: { course: target._id } })
      if (found.lesson.assignment?.assignmentId) {
        await Assignment.updateOne(
          { _id: found.lesson.assignment.assignmentId },
          { $set: { course: target._id } },
        )
      }
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

    const links = captureLinks(found.lesson)

    found.module.lessons = found.module.lessons.filter((l) => String(l._id) !== lessonId)
    await found.course.save()

    await Enrollment.updateMany(
      { course: found.course._id },
      { $pull: { completedLessons: new Types.ObjectId(lessonId) } },
    )
    // Unpublish rather than delete — submissions and marks against them stay.
    await retireOrphanedLinks(links, {})

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
