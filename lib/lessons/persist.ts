/**
 * Writing a lesson's type-specific payload.
 *
 * Shared by the create and update routes so both apply the same rules:
 *  - only the payload belonging to `type` is stored
 *  - every other payload is cleared, so converting a lesson leaves nothing behind
 *  - quiz and assignment lessons get their linked record created or updated
 *  - a linked record orphaned by a type change is cleaned up
 */

import { Types, type HydratedDocument } from "mongoose"

import { Assignment, Quiz, type ICourse, type ILessonItem } from "@/lib/models"
import { sanitiseLessonHtml } from "@/lib/lessons/sanitise"
import { foreignPayloadKeys, type LessonBody } from "@/lib/lessons/schemas"
import type { LessonType } from "@/lib/lessons/types"

interface ApplyContext {
  course: HydratedDocument<ICourse>
  authorId: string
  /** The lesson's own id, needed to link a quiz back to it. */
  lessonId: Types.ObjectId
}

/**
 * Copy a validated body onto a lesson subdocument.
 *
 * The lesson is mutated in place; the caller saves the course. Returns nothing
 * because the interesting side effects — created Quiz/Assignment records — are
 * reachable through the lesson afterwards.
 */
export async function applyLessonBody(
  lesson: ILessonItem,
  body: LessonBody,
  context: ApplyContext,
): Promise<void> {
  const previousType = lesson.type as LessonType | undefined

  lesson.title = body.title
  lesson.description = body.description
  lesson.duration = body.duration
  lesson.status = body.status
  lesson.availableFrom = body.availableFrom
  lesson.completion = body.completion
  lesson.materials = body.materials as ILessonItem["materials"]
  lesson.type = body.type

  // Clear the payloads that don't belong to the new type, and drop the legacy
  // flat fields so a converted lesson can't be read back through them.
  for (const key of foreignPayloadKeys(body.type)) {
    ;(lesson as unknown as Record<string, unknown>)[key] = undefined
  }
  lesson.content = undefined
  lesson.videoUrl = undefined

  switch (body.type) {
    case "reading":
      lesson.reading = {
        ...body.reading,
        // Sanitised here rather than at render time: storing it clean means no
        // renderer can forget, and the stored value is safe for export too.
        content: body.reading.content ? sanitiseLessonHtml(body.reading.content) : undefined,
      }
      break

    case "video":
      // Videos are YouTube links now; any fileId from an earlier uploaded-video
      // lesson is dropped rather than carried forward.
      lesson.video = { ...body.video, fileId: undefined }
      break

    case "interactive":
      lesson.interactive = {
        ...body.interactive,
        fileId: body.interactive.fileId ? new Types.ObjectId(body.interactive.fileId) : undefined,
      }
      break

    case "quiz":
      lesson.quiz = {
        quizId: await resolveQuiz(body, context, lesson),
      }
      break

    case "assignment":
      lesson.assignment = {
        assignmentId: await resolveAssignment(body, context, lesson),
      }
      break
  }

  // A lesson that stops being a quiz or an assignment leaves its record behind.
  // The caller captured the old ids before this ran and retires them, because
  // by now the lesson no longer holds them.
  void previousType
}

/**
 * Find or create the Quiz behind a quiz lesson.
 *
 * The quiz is authored through /api/quizzes — this only guarantees one exists
 * and that it points back at the lesson, so the two can't drift apart.
 */
async function resolveQuiz(
  body: Extract<LessonBody, { type: "quiz" }>,
  context: ApplyContext,
  lesson: ILessonItem,
): Promise<Types.ObjectId> {
  if (body.quiz.quizId) {
    const existing = await Quiz.findById(body.quiz.quizId).select("_id lesson course")
    if (existing) {
      // Keep the back-reference current even if the quiz was made standalone.
      existing.lesson = context.lessonId
      await existing.save()
      return existing._id
    }
  }

  const created = await Quiz.create({
    title: body.title,
    description: body.description,
    kind: "quiz",
    course: context.course._id,
    lesson: context.lessonId,
    questions: [],
    // A quiz with no questions can't be sat, so it starts as a draft whatever
    // the lesson says; publishing happens once questions exist.
    status: "draft",
    createdBy: context.authorId,
  })

  lesson.quiz = { quizId: created._id }
  return created._id
}

/** Find or create the Assignment behind an assignment lesson. */
async function resolveAssignment(
  body: Extract<LessonBody, { type: "assignment" }>,
  context: ApplyContext,
  lesson: ILessonItem,
): Promise<Types.ObjectId> {
  if (body.assignment.assignmentId) {
    const existing = await Assignment.findById(body.assignment.assignmentId).select("_id")
    if (existing) return existing._id
  }

  const created = await Assignment.create({
    title: body.title,
    description: body.description,
    course: context.course._id,
    createdBy: context.authorId,
    // A placeholder deadline a week out: dueDate is required, and refusing to
    // create the lesson until one is typed would block saving a draft.
    dueDate: new Date(Date.now() + 7 * 86_400_000),
    points: 10,
    status: "draft",
  })

  lesson.assignment = { assignmentId: created._id }
  return created._id
}

/** The linked records a lesson pointed at, captured before it is rewritten. */
export interface LinkedRecordIds {
  quizId?: string
  assignmentId?: string
}

export function captureLinks(lesson: ILessonItem): LinkedRecordIds {
  return {
    quizId: lesson.quiz?.quizId ? String(lesson.quiz.quizId) : undefined,
    assignmentId: lesson.assignment?.assignmentId
      ? String(lesson.assignment.assignmentId)
      : undefined,
  }
}

/**
 * Unpublish the records a type change orphaned.
 *
 * Deleting would take submissions and marks with it — a student who handed work
 * in against an assignment must not lose it because a teacher switched the
 * lesson to a video. Reverting to a draft takes it out of students' view while
 * the history survives, and a teacher can still find it under Assignments or
 * Quizzes.
 */
export async function retireOrphanedLinks(
  previous: LinkedRecordIds,
  current: LinkedRecordIds,
): Promise<void> {
  if (previous.quizId && previous.quizId !== current.quizId) {
    await Quiz.updateOne(
      { _id: previous.quizId },
      { $set: { status: "draft" }, $unset: { lesson: "" } },
    )
  }
  if (previous.assignmentId && previous.assignmentId !== current.assignmentId) {
    await Assignment.updateOne({ _id: previous.assignmentId }, { $set: { status: "draft" } })
  }
}
