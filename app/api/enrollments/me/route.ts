import { Enrollment } from "@/lib/models"
import { handleErrors, json, requireUser } from "@/lib/api/helpers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/enrollments/me — the caller's own enrolments with progress.
 *
 * The dashboard needs a progress figure per course; fetching each course in
 * full just to read one number would be several requests for one bar.
 */
export async function GET() {
  try {
    const me = await requireUser()

    const enrollments = await Enrollment.find({ student: me.id })
      .select("course status progress completedLessons finalGrade enrolledAt")
      .populate("course", "title code subject status")
      .lean()

    return json({
      enrollments: enrollments.map((e) => ({
        ...e,
        completedCount: e.completedLessons?.length ?? 0,
      })),
    })
  } catch (err) {
    return handleErrors(err)
  }
}
