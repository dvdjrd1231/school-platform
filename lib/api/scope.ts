/**
 * Shared "which courses may this person see?" logic.
 *
 * Announcements, discussions, calendar events and course content all need the
 * same answer, and getting it subtly different per route is how one family ends
 * up seeing another's classroom. It lives here so there is one definition.
 */

import { Course, Enrollment, User } from "@/lib/models"
import { hasRole, type SessionUser } from "@/lib/api/helpers"

export interface CourseScope {
  /** Course ids the caller may read. Empty for a user attached to nothing. */
  ids: string[]
  /** True when the caller is an admin: no course filter should be applied. */
  unrestricted: boolean
}

/**
 * Resolve the courses a user can see.
 *
 * - admin: everything
 * - teacher: the courses they instruct
 * - student: the courses they're enrolled in (active or completed)
 * - parent: the union of their children's enrolments
 */
export async function courseScope(me: SessionUser): Promise<CourseScope> {
  if (hasRole(me, "admin")) return { ids: [], unrestricted: true }

  if (hasRole(me, "teacher")) {
    const courses = await Course.find({ instructor: me.id }).select("_id").lean()
    return { ids: courses.map((c) => String(c._id)), unrestricted: false }
  }

  const studentIds = hasRole(me, "parent") ? await childrenOf(me.id) : [me.id]
  if (studentIds.length === 0) return { ids: [], unrestricted: false }

  const enrollments = await Enrollment.find({
    student: { $in: studentIds },
    status: { $in: ["active", "completed"] },
  })
    .select("course")
    .lean()

  return {
    ids: [...new Set(enrollments.map((e) => String(e.course)))],
    unrestricted: false,
  }
}

/** The student ids a parent is guardian to. Empty when nobody is linked yet. */
export async function childrenOf(parentId: string): Promise<string[]> {
  const parent = await User.findById(parentId).select("children").lean()
  return (parent?.children ?? []).map((c) => String(c))
}

/**
 * Turn a scope into a Mongo filter fragment for a `course` field.
 *
 * `includeSchoolWide` covers documents with no course at all (school-wide
 * announcements and events), which everyone can see.
 */
export function courseFilter(
  scope: CourseScope,
  { includeSchoolWide = false, field = "course" } = {},
): Record<string, unknown> {
  if (scope.unrestricted) return {}
  const inScope = { [field]: { $in: scope.ids } }
  if (!includeSchoolWide) return inScope
  return { $or: [inScope, { [field]: { $exists: false } }, { [field]: null }] }
}
