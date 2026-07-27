import { z } from "zod"

import { Course, Notification, Quiz, QuizAttempt, Enrollment } from "@/lib/models"
import { QUESTION_TYPES } from "@/lib/models/Quiz"
import {
  ApiError,
  handleErrors,
  hasRole,
  json,
  parseBody,
  requireRole,
  requireUser,
} from "@/lib/api/helpers"
import { courseScope } from "@/lib/api/scope"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/quizzes[?courseId=…&lessonId=…]
 *
 * Students see published quizzes for their courses, with their own attempt
 * count and best score attached. Teachers see their drafts too, with how many
 * students have submitted.
 */
export async function GET(req: Request) {
  try {
    const me = await requireUser()
    const url = new URL(req.url)
    const courseId = url.searchParams.get("courseId")
    const lessonId = url.searchParams.get("lessonId")

    const scope = await courseScope(me)
    if (courseId && !scope.unrestricted && !scope.ids.includes(courseId)) {
      throw new ApiError(403, "You don't have access to that course")
    }

    const filter: Record<string, unknown> = {}
    if (courseId) filter.course = courseId
    else if (!scope.unrestricted) filter.course = { $in: scope.ids }
    if (lessonId) filter.lesson = lessonId

    const isStaff = hasRole(me, "teacher", "admin")
    if (!isStaff) filter.status = "published"

    const quizzes = await Quiz.find(filter)
      .populate("course", "title code")
      .populate("createdBy", "name")
      .sort({ createdAt: -1 })
      .lean()

    const ids = quizzes.map((q) => q._id)

    if (isStaff) {
      // How many students have submitted each quiz — the number a teacher wants
      // before opening the results.
      const counts = await QuizAttempt.aggregate<{ _id: unknown; count: number; students: unknown[] }>([
        { $match: { quiz: { $in: ids } } },
        { $group: { _id: "$quiz", count: { $sum: 1 }, students: { $addToSet: "$student" } } },
      ])
      const map = new Map(counts.map((c) => [String(c._id), c]))

      return json({
        quizzes: quizzes.map((q) => ({
          ...q,
          questionCount: q.questions.length,
          totalPoints: q.questions.reduce((sum, question) => sum + question.points, 0),
          attemptCount: map.get(String(q._id))?.count ?? 0,
          studentCount: map.get(String(q._id))?.students.length ?? 0,
        })),
      })
    }

    const attempts = await QuizAttempt.find({ quiz: { $in: ids }, student: me.id })
      .select("quiz score maxScore fullyGraded submittedAt attemptNumber")
      .lean()

    return json({
      quizzes: quizzes.map((q) => {
        const mine = attempts.filter((a) => String(a.quiz) === String(q._id))
        const best = mine.reduce<(typeof mine)[number] | null>(
          (acc, a) => (acc === null || a.score > acc.score ? a : acc),
          null,
        )

        return {
          ...q,
          // Never ship the answer key to a student.
          questions: q.questions.map((question) => ({
            ...question,
            correctAnswers: [],
            explanation: undefined,
          })),
          questionCount: q.questions.length,
          totalPoints: q.questions.reduce((sum, question) => sum + question.points, 0),
          attemptsTaken: mine.length,
          bestScore: best ? { score: best.score, maxScore: best.maxScore } : null,
          lastAttemptId: mine.length > 0 ? String(mine[mine.length - 1]._id) : null,
        }
      }),
    })
  } catch (err) {
    return handleErrors(err)
  }
}

const questionSchema = z.object({
  prompt: z.string().min(1).max(5000),
  type: z.enum(QUESTION_TYPES).default("multiple-choice"),
  options: z.array(z.string().max(500)).max(12).default([]),
  correctAnswers: z.array(z.string().max(500)).max(12).default([]),
  points: z.number().min(0).max(1000).default(1),
  explanation: z.string().max(2000).optional(),
  order: z.number().int().min(0).default(0),
})

const createSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(5000).optional(),
  kind: z.enum(["quiz", "test", "practice"]).default("quiz"),
  course: z.string(),
  lesson: z.string().optional(),
  questions: z.array(questionSchema).default([]),
  timeLimit: z.number().int().min(0).max(600).default(0),
  attemptsAllowed: z.number().int().min(0).max(50).default(1),
  showAnswers: z.boolean().default(true),
  shuffleQuestions: z.boolean().default(false),
  dueDate: z.coerce.date().optional(),
  status: z.enum(["draft", "published"]).default("draft"),
})

/**
 * POST /api/quizzes — the owning teacher (or an admin) creates a quiz, test or
 * set of practice problems. Publishing notifies the enrolled students.
 */
export async function POST(req: Request) {
  try {
    const me = await requireRole("teacher", "admin")
    const body = await parseBody(req, createSchema)

    const course = await Course.findById(body.course).select("title instructor")
    if (!course) throw new ApiError(404, "Course not found")
    if (String(course.instructor) !== me.id && !hasRole(me, "admin")) {
      throw new ApiError(403, "You can only add quizzes to your own courses")
    }

    const quiz = await Quiz.create({ ...body, createdBy: me.id })

    if (quiz.status === "published" && quiz.kind !== "practice") {
      const enrollments = await Enrollment.find({ course: body.course, status: "active" })
        .select("student")
        .lean()
      if (enrollments.length > 0) {
        await Notification.insertMany(
          enrollments.map((e) => ({
            user: e.student,
            title: `New ${quiz.kind} posted`,
            message: `${quiz.title} is available in ${course.title}.`,
            type: "assignment",
            priority: "medium",
            actionUrl: `/quizzes/${quiz._id}`,
            relatedId: quiz._id,
          })),
        )
      }
    }

    return json(quiz.toObject(), 201)
  } catch (err) {
    return handleErrors(err)
  }
}
