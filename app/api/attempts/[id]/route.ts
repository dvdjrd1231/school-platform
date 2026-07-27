import { z } from "zod"

import { Notification, Quiz, QuizAttempt } from "@/lib/models"
import {
  ApiError,
  assertObjectId,
  handleErrors,
  hasRole,
  json,
  parseBody,
  requireUser,
} from "@/lib/api/helpers"
import { totalAttempt } from "@/lib/services/quiz-grading"

export const runtime = "nodejs"

interface Params {
  params: Promise<{ id: string }>
}

const gradeSchema = z.object({
  marks: z
    .array(
      z.object({
        question: z.string(),
        earned: z.number().min(0),
        feedback: z.string().max(2000).optional(),
      }),
    )
    .min(1),
})

/**
 * PATCH /api/attempts/:id — a teacher marks the written answers.
 *
 * The score is recomputed from every answer rather than adjusted by a delta, so
 * marking the same answer twice can't drift the total.
 */
export async function PATCH(req: Request, { params }: Params) {
  try {
    const me = await requireUser()
    const { id } = await params
    assertObjectId(id, "attempt id")

    const attempt = await QuizAttempt.findById(id)
    if (!attempt) throw new ApiError(404, "Attempt not found")

    const quiz = await Quiz.findById(attempt.quiz)
    if (!quiz) throw new ApiError(404, "Quiz not found")
    if (String(quiz.createdBy) !== me.id && !hasRole(me, "admin")) {
      throw new ApiError(403, "Only the quiz author or an admin can mark this")
    }

    const { marks } = await parseBody(req, gradeSchema)

    for (const mark of marks) {
      const answer = attempt.answers.find((a) => String(a.question) === mark.question)
      if (!answer) continue

      const question = quiz.questions.find((q) => String(q._id) === mark.question)
      const cap = question?.points ?? 0
      if (mark.earned > cap) {
        throw new ApiError(400, `That question is worth ${cap} point(s)`)
      }

      answer.earned = mark.earned
      answer.correct = cap > 0 ? mark.earned >= cap : true
      if (mark.feedback !== undefined) answer.feedback = mark.feedback
    }

    const totals = totalAttempt(quiz.questions, attempt.answers)
    const wasGraded = attempt.fullyGraded
    attempt.score = totals.score
    attempt.maxScore = totals.maxScore
    attempt.fullyGraded = totals.fullyGraded
    await attempt.save()

    // Tell the student once, when it becomes fully marked.
    if (!wasGraded && attempt.fullyGraded) {
      await Notification.create({
        user: attempt.student,
        title: "Quiz marked",
        message: `${quiz.title}: ${attempt.score}/${attempt.maxScore}.`,
        type: "grade",
        priority: "medium",
        actionUrl: `/quizzes/${quiz._id}/results`,
        relatedId: quiz._id,
      })
    }

    return json({
      attemptId: id,
      score: attempt.score,
      maxScore: attempt.maxScore,
      fullyGraded: attempt.fullyGraded,
    })
  } catch (err) {
    return handleErrors(err)
  }
}
