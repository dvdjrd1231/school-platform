import { Types } from "mongoose"

import { Enrollment } from "@/lib/models"
import {
  ApiError,
  assertObjectId,
  handleErrors,
  json,
  requireUser,
} from "@/lib/api/helpers"
import { findLesson, isUnlocked, orderedLessons, progressPercent } from "@/lib/services/lessons"

export const runtime = "nodejs"

interface Params {
  params: Promise<{ lessonId: string }>
}

/**
 * POST /api/lessons/:lessonId/complete
 *
 * Marks the lesson done for the calling student and recomputes their course
 * progress. Refuses lessons that are still locked, so completion can't be used
 * to skip ahead. Returns the next lesson, which the viewer offers as a link.
 */
export async function POST(_req: Request, { params }: Params) {
  try {
    const me = await requireUser()
    const { lessonId } = await params
    assertObjectId(lessonId, "lesson id")

    const found = await findLesson(lessonId)
    if (!found) throw new ApiError(404, "Lesson not found")

    const enrollment = await Enrollment.findOne({ student: me.id, course: found.course._id })
    if (!enrollment) throw new ApiError(403, "You are not enrolled in this course")

    const flat = orderedLessons(found.course)
    const completed = new Set(enrollment.completedLessons.map(String))

    if (!isUnlocked(flat, found.index, completed)) {
      throw new ApiError(409, "Finish the earlier lessons first")
    }

    if (!completed.has(lessonId)) {
      enrollment.completedLessons.push(new Types.ObjectId(lessonId))
      completed.add(lessonId)
    }

    // Count only lessons that still exist, so a deleted lesson can't leave a
    // student stuck above 100%.
    const liveIds = new Set(flat.map((e) => String(e.lesson._id)))
    const completedCount = [...completed].filter((id) => liveIds.has(id)).length
    enrollment.progress = progressPercent(flat.length, completedCount)
    if (enrollment.progress === 100 && enrollment.status === "active") {
      enrollment.status = "completed"
      enrollment.completedAt = new Date()
    }
    await enrollment.save()

    const next = flat[found.index + 1]

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

    const flat = orderedLessons(found.course)
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
