import { Assignment, Enrollment, Submission, User } from "@/lib/models"
import { handleErrors, json, requireRole } from "@/lib/api/helpers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

interface Activity {
  type: "user" | "enrollment" | "assignment" | "grade"
  action: string
  details: string
  at: string
}

/**
 * GET /api/admin/activity — a merged, most-recent-first feed of real events,
 * assembled from the newest few rows of several collections. Admin only.
 */
export async function GET() {
  try {
    await requireRole("admin")

    const [users, enrollments, assignments, graded] = await Promise.all([
      User.find().sort({ createdAt: -1 }).limit(5).select("name roles createdAt").lean(),
      Enrollment.find({ status: "active" })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("student", "name")
        .populate("course", "title")
        .lean(),
      Assignment.find({ status: "published" })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("course", "title")
        .lean(),
      Submission.find({ status: { $in: ["graded", "returned"] } })
        .sort({ gradedAt: -1 })
        .limit(5)
        .populate("student", "name")
        .populate("assignment", "title")
        .lean(),
    ])

    const activity: Activity[] = [
      ...users.map((u) => ({
        type: "user" as const,
        action: `New ${u.roles?.[0] ?? "user"} account`,
        details: u.name,
        at: (u.createdAt ?? new Date()).toISOString(),
      })),
      ...enrollments.map((e) => ({
        type: "enrollment" as const,
        action: "Student enrolled",
        details: `${(e.student as { name?: string })?.name ?? "Student"} → ${(e.course as { title?: string })?.title ?? "course"}`,
        at: (e.createdAt ?? new Date()).toISOString(),
      })),
      ...assignments.map((a) => ({
        type: "assignment" as const,
        action: "Assignment posted",
        details: `${a.title} · ${(a.course as { title?: string })?.title ?? "course"}`,
        at: (a.createdAt ?? new Date()).toISOString(),
      })),
      ...graded.map((s) => ({
        type: "grade" as const,
        action: "Grade published",
        details: `${(s.assignment as { title?: string })?.title ?? "Assignment"} · ${(s.student as { name?: string })?.name ?? "student"}`,
        at: (s.gradedAt ?? s.updatedAt ?? new Date()).toISOString(),
      })),
    ]
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, 12)

    return json({ activity })
  } catch (err) {
    return handleErrors(err)
  }
}
