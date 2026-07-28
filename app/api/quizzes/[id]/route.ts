import { z } from "zod"

import { Quiz, QuizAttempt } from "@/lib/models"
import { QUESTION_TYPES } from "@/lib/models/Quiz"
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
import { seededShuffle } from "@/lib/services/quiz-grading"

export const runtime = "nodejs"

interface Params {
  params: Promise<{ id: string }>
}

/**
 * GET /api/quizzes/:id
 *
 * For a teacher: the quiz as authored, answer key included.
 * For a student: the same minus the answer key, plus how many attempts they
 * have left. Stripping the key server-side matters — hiding it in the UI would
 * still put it in the network response.
 */
export async function GET(_req: Request, { params }: Params) {
  try {
    const me = await requireUser()
    const { id } = await params
    assertObjectId(id, "quiz id")

    const quiz = await Quiz.findById(id).populate("course", "title code instructor").lean()
    if (!quiz) throw new ApiError(404, "Quiz not found")

    const courseId = String(
      (quiz.course as unknown as { _id?: unknown })?._id ?? quiz.course,
    )
    const instructorId = String((quiz.course as unknown as { instructor?: unknown })?.instructor)
    const canEdit = hasRole(me, "admin") || instructorId === me.id

    if (!canEdit) {
      const scope = await courseScope(me)
      if (!scope.unrestricted && !scope.ids.includes(courseId)) {
        throw new ApiError(403, "You don't have access to that course")
      }
      if (quiz.status !== "published") throw new ApiError(404, "Quiz not found")
    }

    const totalPoints = quiz.questions.reduce((sum, q) => sum + q.points, 0)

    if (canEdit) {
      return json({ ...quiz, totalPoints, canEdit: true })
    }

    const attempts = await QuizAttempt.find({ quiz: id, student: me.id })
      .select("score maxScore fullyGraded submittedAt attemptNumber")
      .sort({ attemptNumber: 1 })
      .lean()

    const attemptsLeft =
      quiz.attemptsAllowed === 0 ? Infinity : quiz.attemptsAllowed - attempts.length

    // Stripping correctAnswers isn't enough for every type — two of them carry
    // the answer in their presentation:
    //
    //  - `matching` stores left→right pairs, so sending the pairs *is* sending
    //    the answer key. The student gets the left-hand items and a shuffled
    //    pool of right-hand values, with no pairing between them.
    //  - `ordering` stores its options already in the correct sequence, so
    //    sending them in order gives the answer away. They are shuffled first.
    //
    // The shuffle is seeded per student and per quiz, so it stays put across
    // refetches (the order can't be rerolled to fish for the original) while
    // differing between students.
    const seed = `${id}:${me.id}`

    return json({
      ...quiz,
      questions: quiz.questions.map((q) => {
        const base = { ...q, correctAnswers: [], explanation: undefined }

        if (q.type === "matching") {
          return {
            ...base,
            pairs: q.pairs.map((pair) => ({ left: pair.left, right: "" })),
            options: seededShuffle(
              q.pairs.map((pair) => pair.right),
              `${seed}:${String(q._id)}`,
            ),
          }
        }

        if (q.type === "ordering") {
          return { ...base, options: seededShuffle(q.options, `${seed}:${String(q._id)}`) }
        }

        return base
      }),
      totalPoints,
      canEdit: false,
      myAttempts: attempts,
      canAttempt: attemptsLeft > 0,
      attemptsLeft: attemptsLeft === Infinity ? null : attemptsLeft,
    })
  } catch (err) {
    return handleErrors(err)
  }
}

const questionSchema = z.object({
  _id: z.string().optional(),
  prompt: z.string().min(1).max(5000),
  type: z.enum(QUESTION_TYPES),
  options: z.array(z.string().max(500)).max(20).default([]),
  correctAnswers: z.array(z.string().max(1000)).max(20).default([]),
  pairs: z
    .array(z.object({ left: z.string().max(500), right: z.string().max(500) }))
    .max(20)
    .default([]),
  points: z.number().min(0).max(1000).default(1),
  explanation: z.string().max(2000).optional(),
  media: z
    .object({
      kind: z.enum(["image", "audio", "video"]),
      url: z.string().url(),
      fileId: z.string().optional(),
    })
    .optional(),
  required: z.boolean().default(false),
  order: z.number().int().min(0).default(0),
})

const updateSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  description: z.string().max(5000).optional(),
  instructions: z.string().max(20_000).optional(),
  kind: z.enum(["quiz", "test", "practice"]).optional(),
  questions: z.array(questionSchema).optional(),
  timeLimit: z.number().int().min(0).max(600).optional(),
  attemptsAllowed: z.number().int().min(0).max(50).optional(),
  passingScore: z.number().min(0).max(100).optional(),

  shuffleQuestions: z.boolean().optional(),
  shuffleAnswers: z.boolean().optional(),
  oneQuestionAtATime: z.boolean().optional(),
  allowBacktrack: z.boolean().optional(),

  releaseResults: z.enum(["immediately", "after-review"]).optional(),
  showAnswers: z.boolean().optional(),
  showExplanations: z.boolean().optional(),

  availableFrom: z.coerce.date().optional(),
  dueDate: z.coerce.date().optional(),
  closesAt: z.coerce.date().optional(),
  status: z.enum(["draft", "published"]).optional(),
})

/** PATCH /api/quizzes/:id — owning teacher or admin. */
export async function PATCH(req: Request, { params }: Params) {
  try {
    const me = await requireUser()
    const { id } = await params
    assertObjectId(id, "quiz id")

    const quiz = await Quiz.findById(id)
    if (!quiz) throw new ApiError(404, "Quiz not found")
    if (String(quiz.createdBy) !== me.id && !hasRole(me, "admin")) {
      throw new ApiError(403, "Only the author or an admin can edit this quiz")
    }

    const body = await parseBody(req, updateSchema)

    // Rewriting the questions of a quiz people have already sat would strand
    // their answers against question ids that no longer exist.
    if (body.questions) {
      const submitted = await QuizAttempt.countDocuments({ quiz: id })
      if (submitted > 0) {
        throw new ApiError(
          409,
          `${submitted} student(s) have already taken this quiz, so its questions can't be changed. Create a new quiz instead.`,
        )
      }
    }

    Object.assign(quiz, body)
    await quiz.save()

    return json(quiz.toObject())
  } catch (err) {
    return handleErrors(err)
  }
}

/** DELETE /api/quizzes/:id — removes the quiz and every attempt at it. */
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const me = await requireUser()
    const { id } = await params
    assertObjectId(id, "quiz id")

    const quiz = await Quiz.findById(id)
    if (!quiz) throw new ApiError(404, "Quiz not found")
    if (String(quiz.createdBy) !== me.id && !hasRole(me, "admin")) {
      throw new ApiError(403, "Only the author or an admin can delete this quiz")
    }

    await QuizAttempt.deleteMany({ quiz: id })
    await quiz.deleteOne()

    return json({ id, deleted: true })
  } catch (err) {
    return handleErrors(err)
  }
}
