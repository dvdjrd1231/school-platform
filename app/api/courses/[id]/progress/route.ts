import { Types } from "mongoose"

import { Assignment, Course, Enrollment, Quiz, QuizAttempt, Submission } from "@/lib/models"
import {
  ApiError,
  assertObjectId,
  handleErrors,
  hasRole,
  json,
  requireUser,
} from "@/lib/api/helpers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

interface Params {
  params: Promise<{ id: string }>
}

/**
 * GET /api/courses/:id/progress — one row per enrolled student.
 *
 * Everything the class-progress screen needs in a single request: lesson
 * progress, assignments handed in and marked, quizzes taken, the current average
 * and when they were last active. Doing this per student in the browser would be
 * a request per row.
 */
export async function GET(_req: Request, { params }: Params) {
  try {
    const me = await requireUser()
    const { id } = await params
    assertObjectId(id, "course id")

    const course = await Course.findById(id).select("title instructor modules").lean()
    if (!course) throw new ApiError(404, "Course not found")

    const isStaff = hasRole(me, "admin") || String(course.instructor) === me.id
    if (!isStaff) throw new ApiError(403, "Only the class teacher or an admin can see this")

    const [enrollments, assignments, quizzes] = await Promise.all([
      Enrollment.find({ course: id, status: { $in: ["active", "completed"] } })
        .populate("student", "name email avatar studentId gradeLevel")
        .lean(),
      Assignment.find({ course: id, status: "published" }).select("_id points").lean(),
      Quiz.find({ course: id, status: "published" }).select("_id").lean(),
    ])

    const assignmentIds = assignments.map((a) => a._id)
    const quizIds = quizzes.map((q) => q._id)
    const studentIds = enrollments.map((e) =>
      Types.ObjectId.createFromHexString(String((e.student as { _id: unknown })._id)),
    )

    const [submissions, attempts] = await Promise.all([
      Submission.find({ assignment: { $in: assignmentIds }, student: { $in: studentIds } })
        .select("student assignment status score submittedAt")
        .lean(),
      QuizAttempt.find({ quiz: { $in: quizIds }, student: { $in: studentIds } })
        .select("student quiz score maxScore submittedAt")
        .lean(),
    ])

    const lessonCount = (course.modules ?? []).reduce((n, m) => n + (m.lessons?.length ?? 0), 0)

    const rows = enrollments.map((enrollment) => {
      const student = enrollment.student as {
        _id: unknown
        name?: string
        email?: string
        avatar?: string
      }
      const key = String(student._id)

      const mine = submissions.filter((s) => String(s.student) === key)
      const graded = mine.filter((s) => s.status === "graded" && typeof s.score === "number")
      const myAttempts = attempts.filter((a) => String(a.student) === key)

      // Average across marked work, weighted by the points each piece is worth.
      const gradedPercents = graded.map((s) => {
        const assignment = assignments.find((a) => String(a._id) === String(s.assignment))
        const points = assignment?.points ?? 0
        return points > 0 ? ((s.score as number) / points) * 100 : null
      })
      const quizPercents = myAttempts
        .filter((a) => a.maxScore > 0)
        .map((a) => (a.score / a.maxScore) * 100)
      const scored = [...gradedPercents, ...quizPercents].filter(
        (value): value is number => value !== null,
      )
      const average =
        scored.length > 0
          ? Math.round(scored.reduce((sum, value) => sum + value, 0) / scored.length)
          : null

      const timestamps = [
        ...mine.map((s) => s.submittedAt),
        ...myAttempts.map((a) => a.submittedAt),
      ].filter(Boolean) as Date[]
      const lastActivity =
        timestamps.length > 0
          ? new Date(Math.max(...timestamps.map((d) => new Date(d).getTime()))).toISOString()
          : null

      return {
        student: { ...student, _id: key },
        lessonProgress: enrollment.progress ?? 0,
        lessonsCompleted: enrollment.completedLessons?.length ?? 0,
        lessonTotal: lessonCount,
        assignments: { submitted: mine.length, graded: graded.length, total: assignments.length },
        quizzes: { taken: new Set(myAttempts.map((a) => String(a.quiz))).size, total: quizzes.length },
        average,
        lastActivity,
        status: enrollment.status,
      }
    })

    return json({
      course: { _id: String(course._id), title: course.title },
      students: rows,
      totals: {
        students: rows.length,
        assignments: assignments.length,
        quizzes: quizzes.length,
        lessons: lessonCount,
      },
    })
  } catch (err) {
    return handleErrors(err)
  }
}
