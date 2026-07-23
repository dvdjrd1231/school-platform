import { Course, Submission } from "@/lib/models"
import { handleErrors, hasRole, json, requireRole } from "@/lib/api/helpers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/admin/grades — a cross-course gradebook of graded submissions.
 *
 * Admin sees every course; a teacher sees only their own. Optional
 * ?courseId=… narrows to one course.
 */
export async function GET(req: Request) {
  try {
    const me = await requireRole("teacher", "admin")
    const courseId = new URL(req.url).searchParams.get("courseId")

    // Determine which courses the caller may see grades for.
    const courseFilter: Record<string, unknown> = hasRole(me, "admin") ? {} : { instructor: me.id }
    if (courseId) courseFilter._id = courseId
    const courses = await Course.find(courseFilter).select("code title").lean()
    const courseIds = courses.map((c) => c._id)

    const submissions = await Submission.find({
      course: { $in: courseIds },
      score: { $ne: null },
    })
      .populate("student", "name studentId")
      .populate("assignment", "title points category")
      .sort({ gradedAt: -1 })
      .lean()

    const courseById = new Map(courses.map((c) => [String(c._id), c]))

    const rows = submissions.map((s) => {
      const assignment = s.assignment as { title?: string; points?: number; category?: string } | null
      const student = s.student as { name?: string; studentId?: string } | null
      const course = courseById.get(String(s.course))
      const points = assignment?.points ?? 0
      return {
        submissionId: String(s._id),
        student: student?.name ?? "Unknown",
        studentId: student?.studentId ?? null,
        courseCode: course?.code ?? "",
        courseTitle: course?.title ?? "",
        assignment: assignment?.title ?? "",
        category: assignment?.category ?? "",
        score: s.score ?? null,
        points,
        percent: points > 0 && s.score != null ? Math.round((s.score / points) * 100) : null,
        isLate: s.isLate ?? false,
        gradedAt: s.gradedAt ? new Date(s.gradedAt).toISOString() : null,
      }
    })

    const graded = rows.filter((r) => r.percent !== null)
    const average =
      graded.length > 0
        ? Math.round(graded.reduce((sum, r) => sum + (r.percent as number), 0) / graded.length)
        : null

    return json({
      rows,
      courses: courses.map((c) => ({ _id: String(c._id), code: c.code, title: c.title })),
      summary: { total: rows.length, average },
    })
  } catch (err) {
    return handleErrors(err)
  }
}
