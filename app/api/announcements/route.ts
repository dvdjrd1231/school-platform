import { z } from "zod"

import { Announcement, Course, Enrollment, Notification, User } from "@/lib/models"
import {
  ApiError,
  handleErrors,
  hasRole,
  json,
  parseBody,
  requireRole,
  requireUser,
} from "@/lib/api/helpers"
import { courseFilter, courseScope } from "@/lib/api/scope"
import type { UserRole } from "@/lib/models/User"

export const runtime = "nodejs"

/**
 * GET /api/announcements[?courseId=…]
 *
 * Returns school-wide announcements plus those for courses the caller belongs
 * to, filtered by audience. Pinned first, then newest.
 */
export async function GET(req: Request) {
  try {
    const me = await requireUser()
    const courseId = new URL(req.url).searchParams.get("courseId")

    const scope = await courseScope(me)
    const filter: Record<string, unknown> = courseId
      ? { course: courseId }
      : courseFilter(scope, { includeSchoolWide: true })

    // A course-scoped request still has to respect the caller's own access.
    if (courseId && !scope.unrestricted && !scope.ids.includes(courseId)) {
      throw new ApiError(403, "You don't have access to that course")
    }

    // Everyone sees "all"; otherwise the audience has to match a role they hold.
    if (!hasRole(me, "admin")) {
      filter.audience = { $in: ["all", ...me.roles] }
    }

    const announcements = await Announcement.find(filter)
      .populate("author", "name email avatar")
      .populate("course", "title code")
      .populate("replies.author", "name email avatar")
      .sort({ pinned: -1, createdAt: -1 })
      .lean()

    return json({ announcements })
  } catch (err) {
    return handleErrors(err)
  }
}

const createSchema = z.object({
  title: z.string().min(2).max(200),
  content: z.string().min(1).max(20_000),
  /** Omit for a school-wide announcement. */
  course: z.string().optional(),
  audience: z.enum(["all", "students", "teachers", "parents"]).default("all"),
  priority: z.enum(["high", "medium", "low"]).default("medium"),
  pinned: z.boolean().default(false),
})

/**
 * POST /api/announcements — teachers and admins.
 *
 * A teacher may post to their own course, or school-wide. Everyone who can see
 * it gets a notification.
 */
export async function POST(req: Request) {
  try {
    const me = await requireRole("teacher", "admin")
    const body = await parseBody(req, createSchema)

    let courseTitle: string | undefined
    if (body.course) {
      const course = await Course.findById(body.course).select("title instructor")
      if (!course) throw new ApiError(404, "Course not found")
      if (String(course.instructor) !== me.id && !hasRole(me, "admin")) {
        throw new ApiError(403, "You can only post announcements to your own courses")
      }
      courseTitle = course.title
    }

    const announcement = await Announcement.create({ ...body, author: me.id })
    await notifyAudience(announcement, courseTitle)

    const populated = await Announcement.findById(announcement._id)
      .populate("author", "name email avatar")
      .populate("course", "title code")
      .lean()

    return json(populated, 201)
  } catch (err) {
    return handleErrors(err)
  }
}

/**
 * Notify the people an announcement is aimed at.
 *
 * Course announcements reach that course's students; school-wide ones reach
 * every active account matching the audience. Capped so a school-wide post to a
 * large roll doesn't stall the request.
 */
async function notifyAudience(
  announcement: { _id: unknown; title: string; course?: unknown; audience: string },
  courseTitle?: string,
) {
  let recipients: string[] = []

  if (announcement.course) {
    const enrollments = await Enrollment.find({ course: announcement.course, status: "active" })
      .select("student")
      .lean()
    recipients = enrollments.map((e) => String(e.student))
  } else {
    const roleFilter =
      announcement.audience === "all"
        ? {}
        : { roles: announcement.audience.replace(/s$/, "") as UserRole }
    const users = await User.find({ status: "active", ...roleFilter })
      .select("_id")
      .limit(2000)
      .lean()
    recipients = users.map((u) => String(u._id))
  }

  if (recipients.length === 0) return

  await Notification.insertMany(
    recipients.map((user) => ({
      user,
      title: "New announcement",
      message: courseTitle
        ? `${announcement.title} — posted in ${courseTitle}.`
        : announcement.title,
      type: "announcement",
      priority: "medium",
      actionUrl: `/announcements`,
      relatedId: announcement._id,
    })),
  )
}
