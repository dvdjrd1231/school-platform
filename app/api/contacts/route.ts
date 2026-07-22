import { Course, Enrollment, User } from "@/lib/models"
import { handleErrors, hasRole, json, requireUser } from "@/lib/api/helpers"
import type { Types } from "mongoose"

export const runtime = "nodejs"

/**
 * GET /api/contacts — who the caller is allowed to start a conversation with.
 *
 * `/api/users` is staff-only, so a parent has no way to find their child's
 * teacher. Rather than open that endpoint up, this returns a scoped address
 * book derived from real relationships:
 *
 *   admin    -> everyone
 *   teacher  -> students in their courses, those students' guardians, and staff
 *   parent   -> teachers of their children's courses, plus admins
 *   student  -> teachers of the courses they're enrolled in
 *
 * Only name/email/roles are exposed — never contact details of unrelated users.
 */
export async function GET() {
  try {
    const me = await requireUser()
    const ids = new Set<string>()

    if (hasRole(me, "admin")) {
      const all = await User.find({ status: "active", _id: { $ne: me.id } })
        .select("name email roles avatar studentId")
        .sort({ name: 1 })
        .lean()
      return json({ contacts: all })
    }

    if (hasRole(me, "teacher")) {
      const courses = await Course.find({ instructor: me.id }).select("_id").lean()
      const courseIds = courses.map((c) => c._id)

      const enrollments = await Enrollment.find({ course: { $in: courseIds }, status: "active" })
        .select("student")
        .lean()
      const studentIds = enrollments.map((e) => String(e.student))
      studentIds.forEach((s) => ids.add(s))

      // Guardians of those students, so a teacher can reach a parent.
      const guardians = await User.find({ roles: "parent", children: { $in: studentIds } })
        .select("_id")
        .lean()
      guardians.forEach((g) => ids.add(String(g._id)))

      // Colleagues and admins.
      const staff = await User.find({ roles: { $in: ["teacher", "admin"] }, status: "active" })
        .select("_id")
        .lean()
      staff.forEach((s) => ids.add(String(s._id)))
    } else if (hasRole(me, "parent")) {
      const self = await User.findById(me.id).select("children").lean()
      const childIds = (self?.children ?? []) as Types.ObjectId[]

      const enrollments = await Enrollment.find({ student: { $in: childIds }, status: "active" })
        .select("course")
        .lean()
      const courses = await Course.find({ _id: { $in: enrollments.map((e) => e.course) } })
        .select("instructor")
        .lean()
      courses.forEach((c) => ids.add(String(c.instructor)))

      const admins = await User.find({ roles: "admin", status: "active" }).select("_id").lean()
      admins.forEach((a) => ids.add(String(a._id)))
    } else {
      // Student: the teachers of their own courses.
      const enrollments = await Enrollment.find({ student: me.id, status: "active" })
        .select("course")
        .lean()
      const courses = await Course.find({ _id: { $in: enrollments.map((e) => e.course) } })
        .select("instructor")
        .lean()
      courses.forEach((c) => ids.add(String(c.instructor)))
    }

    ids.delete(me.id)

    const contacts = await User.find({ _id: { $in: [...ids] }, status: "active" })
      .select("name email roles avatar studentId")
      .sort({ name: 1 })
      .lean()

    return json({ contacts })
  } catch (err) {
    return handleErrors(err)
  }
}
