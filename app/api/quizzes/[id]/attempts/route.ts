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
import { courseScope } from "@/lib/api/scope"
import { gradeAnswer, totalAttempt } from "@/lib/services/quiz-grading"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

interface Params {
  params: Promise<{ id: string }>
}

/**
 * GET /api/quizzes/:id/attempts — the results view.
 *
 * A teacher gets every attempt with the student named; a student gets only
 * their own. Correct answers are attached only when the quiz reveals them (or
 * the caller is staff), so the results page can show what was right.
 */
export async function GET(_req: Request, { params }: Params) {
  try {
    const me = await requireUser()
    const { id } = await params
    assertObjectId(id, "quiz id")

    const quiz = await Quiz.findById(id).populate("course", "title instructor").lean()
    if (!quiz) throw new ApiError(404, "Quiz not found")

    const instructorId = String((quiz.course as unknown as { instructor?: unknown })?.instructor)
    const isStaff = hasRole(me, "admin") || instructorId === me.id

    const attempts = await QuizAttempt.find(isStaff ? { quiz: id } : { quiz: id, student: me.id })
      .populate("student", "name email avatar")
      .sort({ submittedAt: -1 })
      .lean()

    const revealAnswers = isStaff || quiz.showAnswers

    const scores = attempts.map((a) => (a.maxScore > 0 ? (a.score / a.maxScore) * 100 : 0))
    const average = scores.length > 0 ? scores.reduce((s, v) => s + v, 0) / scores.length : null

    return json({
      quiz: {
        _id: String(quiz._id),
        title: quiz.title,
        kind: quiz.kind,
        showAnswers: quiz.showAnswers,
        questions: quiz.questions.map((q) => ({
          _id: String(q._id),
          prompt: q.prompt,
          type: q.type,
          options: q.options,
          points: q.points,
          order: q.order,
          correctAnswers: revealAnswers ? q.correctAnswers : [],
          explanation: revealAnswers ? q.explanation : undefined,
        })),
      },
      attempts,
      isStaff,
      summary: {
        count: attempts.length,
        averagePercent: average === null ? null : Math.round(average),
        awaitingMarking: attempts.filter((a) => !a.fullyGraded).length,
      },
    })
  } catch (err) {
    return handleErrors(err)
  }
}

const submitSchema = z.object({
  answers: z
    .array(
      z.object({
        question: z.string(),
        response: z.array(z.string().max(10_000)).default([]),
      }),
    )
    .default([]),
  /** When the student opened the quiz — used to enforce the time limit. */
  startedAt: z.coerce.date().optional(),
})

/**
 * POST /api/quizzes/:id/attempts — submit an attempt.
 *
 * Marking happens here rather than in the browser: the answer key never leaves
 * the server, so the score can't be forged. Essays are left unmarked for the
 * teacher and the attempt stays "awaiting marking" until they're done.
 */
export async function POST(req: Request, { params }: Params) {
  try {
    const me = await requireUser()
    const { id } = await params
    assertObjectId(id, "quiz id")

    const quiz = await Quiz.findById(id).populate("course", "title instructor")
    if (!quiz) throw new ApiError(404, "Quiz not found")
    if (quiz.status !== "published") throw new ApiError(409, "This quiz isn't published yet")

    const courseId = String(
      (quiz.course as unknown as { _id?: unknown })?._id ?? quiz.course,
    )
    const scope = await courseScope(me)
    if (!scope.unrestricted && !scope.ids.includes(courseId)) {
      throw new ApiError(403, "You don't have access to that course")
    }

    const taken = await QuizAttempt.countDocuments({ quiz: id, student: me.id })
    if (quiz.attemptsAllowed > 0 && taken >= quiz.attemptsAllowed) {
      throw new ApiError(409, `You've used all ${quiz.attemptsAllowed} attempt(s) at this quiz`)
    }

    const body = await parseBody(req, submitSchema)

    // Enforce the time limit against the server clock, with a small grace
    // period so a slow final submit isn't punished.
    if (quiz.timeLimit > 0 && body.startedAt) {
      const elapsedMinutes = (Date.now() - body.startedAt.getTime()) / 60_000
      if (elapsedMinutes > quiz.timeLimit + 1) {
        throw new ApiError(409, `Time's up — this ${quiz.kind} allows ${quiz.timeLimit} minutes`)
      }
    }

    // Build the answer list from the quiz's questions, not the submission: an
    // answer for a question that isn't on this quiz is dropped, and a question
    // the student skipped still gets marked (as blank) rather than vanishing.
    const submitted = body.answers ?? []
    const answers = quiz.questions.map((question) => {
      const given = submitted.find((a) => a.question === String(question._id))
      const response = given?.response ?? []
      const { earned, correct } = gradeAnswer(question, response)
      return { question: question._id as never, response, earned, correct }
    })

    const totals = totalAttempt(quiz.questions, answers)

    const attempt = await QuizAttempt.create({
      quiz: id,
      student: me.id,
      answers,
      score: totals.score,
      maxScore: totals.maxScore,
      fullyGraded: totals.fullyGraded,
      attemptNumber: taken + 1,
      startedAt: body.startedAt ?? new Date(),
      submittedAt: new Date(),
    })

    // Practice is for self-checking; nobody needs telling about it.
    if (!totals.fullyGraded && quiz.kind !== "practice") {
      await Notification.create({
        user: quiz.createdBy,
        title: "Quiz awaiting marking",
        message: `${me.name ?? "A student"} submitted ${quiz.title} — some answers need marking.`,
        type: "assignment",
        priority: "medium",
        actionUrl: `/quizzes/${quiz._id}/results`,
        relatedId: quiz._id,
      })
    }

    return json(
      {
        attemptId: String(attempt._id),
        score: attempt.score,
        maxScore: attempt.maxScore,
        fullyGraded: attempt.fullyGraded,
        percent: attempt.maxScore > 0 ? Math.round((attempt.score / attempt.maxScore) * 100) : 0,
        // Feedback is only returned when the quiz is set to reveal answers.
        answers: quiz.showAnswers
          ? attempt.answers.map((a) => {
              const question = quiz.questions.find((q) => String(q._id) === String(a.question))
              return {
                question: String(a.question),
                correct: a.correct,
                earned: a.earned,
                correctAnswers: question?.correctAnswers ?? [],
                explanation: question?.explanation,
              }
            })
          : [],
      },
      201,
    )
  } catch (err) {
    return handleErrors(err)
  }
}
