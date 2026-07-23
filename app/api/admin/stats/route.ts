import { Assignment, Course, Enrollment, Submission, User } from "@/lib/models"
import { handleErrors, json, requireRole } from "@/lib/api/helpers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/admin/stats — platform-wide counts for the admin dashboard.
 * Admin only. Every number is a live count, not a stored total.
 */
export async function GET() {
  try {
    await requireRole("admin")

    const [
      totalStudents,
      totalTeachers,
      totalParents,
      activeCourses,
      totalCourses,
      publishedAssignments,
      pendingGrades,
      gradedSubmissions,
      activeEnrollments,
    ] = await Promise.all([
      User.countDocuments({ roles: "student", status: "active" }),
      User.countDocuments({ roles: "teacher", status: "active" }),
      User.countDocuments({ roles: "parent", status: "active" }),
      Course.countDocuments({ status: "active" }),
      Course.countDocuments({}),
      Assignment.countDocuments({ status: "published" }),
      // Work turned in but not yet graded — the teacher to-do count.
      Submission.countDocuments({ status: "submitted" }),
      Submission.countDocuments({ status: { $in: ["graded", "returned"] } }),
      Enrollment.countDocuments({ status: "active" }),
    ])

    // Average graded score across the platform, as a completion/health proxy.
    const avg = await Submission.aggregate<{ _id: null; avg: number }>([
      { $match: { score: { $ne: null } } },
      { $group: { _id: null, avg: { $avg: "$score" } } },
    ])
    const totalPointsAgg = await Submission.aggregate<{ _id: null; avgPct: number }>([
      { $match: { score: { $ne: null } } },
      {
        $lookup: {
          from: "assignments",
          localField: "assignment",
          foreignField: "_id",
          as: "a",
        },
      },
      { $unwind: "$a" },
      { $match: { "a.points": { $gt: 0 } } },
      { $group: { _id: null, avgPct: { $avg: { $multiply: [{ $divide: ["$score", "$a.points"] }, 100] } } } },
    ])

    return json({
      totalStudents,
      totalTeachers,
      totalParents,
      activeCourses,
      totalCourses,
      publishedAssignments,
      pendingGrades,
      gradedSubmissions,
      activeEnrollments,
      averageScorePercent:
        totalPointsAgg.length > 0 ? Math.round(totalPointsAgg[0].avgPct) : null,
      averageRawScore: avg.length > 0 ? Math.round(avg[0].avg) : null,
    })
  } catch (err) {
    return handleErrors(err)
  }
}
