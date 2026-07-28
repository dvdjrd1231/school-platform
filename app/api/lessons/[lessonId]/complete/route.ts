import { Types } from "mongoose"

import { Enrollment } from "@/lib/models"
import { ApiError, assertObjectId, handleErrors, json, requireUser } from "@/lib/api/helpers"
import {
  findLesson,
  isUnlocked,
  orderedLessons,
  progressPercent,
  visibleToStudents,
} from "@/lib/services/lessons"
import { normaliseLesson } from "@/lib/lessons/normalise"
import { canCompleteLesson } from "@/lib/services/lesson-completion"

export const runtime = "nodejs"

interface Params {
  params: Promise<{ lessonId: string }>
}

/**
 * POST /api/lessons/:lessonId/complete
 *
 * Marks the lesson done for the calling student and recomputes their course
 * progress. Two gates before that: the lesson must be unlocked (so completion
 * can't be used to skip ahead), and the lesson's own completion rule must be
 * satisfied where that is checkable — see lib/services/lesson-completion.ts.
 */
export async function POST(_req: Request, { params }: Params) {
  try {
    const me = await requireUser()
    const { lessonId } = await params
    assertObjectId(lessonId, "lesson id")

    const found = await findLesson(lessonId)
    if (!found) throw new ApiError(404, "Lesson not found")

    const normalised = normaliseLesson(found.lesson)
    if (!visibleToStudents(normalised)) throw new ApiError(404, "Lesson not found")

    const enrollment = await Enrollment.findOne({ student: me.id, course: found.course._id })
    if (!enrollment) throw new ApiError(403, "You are not enrolled in this course")

    // Students walk the published sequence, so drafts don't block them.
    const flat = orderedLessons(found.course, { publishedOnly: true })
    const index = flat.findIndex((e) => String(e.lesson._id) === lessonId)
    const completed = new Set(enrollment.completedLessons.map(String))

    if (!isUnlocked(flat, index, completed)) {
      throw new ApiError(409, "Finish the earlier lessons first")
    }

    const check = await canCompleteLesson(normalised, me.id)
    if (!check.allowed) {
      throw new ApiError(409, check.reason ?? "This lesson isn't finished yet")
    }

    if (!completed.has(lessonId)) {
      enrollment.completedLessons.push(new Types.ObjectId(lessonId))
      completed.add(lessonId)
    }

    // Count only lessons that still exist and are visible, so a deleted or
    // unpublished lesson can't leave a student stuck above 100%.
    const liveIds = new Set(flat.map((e) => String(e.lesson._id)))
    const completedCount = [...completed].filter((id) => liveIds.has(id)).length
    enrollment.progress = progressPercent(flat.length, completedCount)
    if (enrollment.progress === 100 && enrollment.status === "active") {
      enrollment.status = "completed"
      enrollment.completedAt = new Date()
    }
    await enrollment.save()

    const next = flat[index + 1]

    return json({
      lessonId,
      completed: true,
      progress: enrollment.progress,
      completedCount,
      total: flat.length,
      next: next ? { lessonId: String(next.lesson._id), title: next.lesson.title } : null,
    })
  } catch (err) {
    return handleErrors(err)
  }
}

/** DELETE /api/lessons/:lessonId/complete — undo, e.g. to revisit a lesson. */
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const me = await requireUser()
    const { lessonId } = await params
    assertObjectId(lessonId, "lesson id")

    const found = await findLesson(lessonId)
    if (!found) throw new ApiError(404, "Lesson not found")

    const enrollment = await Enrollment.findOne({ student: me.id, course: found.course._id })
    if (!enrollment) throw new ApiError(403, "You are not enrolled in this course")

    enrollment.completedLessons = enrollment.completedLessons.filter(
      (id) => String(id) !== lessonId,
    ) as never

    const flat = orderedLessons(found.course, { publishedOnly: true })
    const liveIds = new Set(flat.map((e) => String(e.lesson._id)))
    const completedCount = enrollment.completedLessons.filter((id) => liveIds.has(String(id))).length
    enrollment.progress = progressPercent(flat.length, completedCount)
    if (enrollment.status === "completed" && enrollment.progress < 100) {
      enrollment.status = "active"
      enrollment.completedAt = undefined
    }
    await enrollment.save()

    return json({ lessonId, completed: false, progress: enrollment.progress })
  } catch (err) {
    return handleErrors(err)
  }
}
