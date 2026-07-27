import { z } from "zod"

import { Assignment, CalendarEvent, Course } from "@/lib/models"
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

export const runtime = "nodejs"

/**
 * GET /api/events?from=&to=&courseId=
 *
 * Everything that lands on a calendar: events people created, plus assignment
 * due dates pulled in read-only so a student's calendar shows their deadlines
 * without anyone having to duplicate them by hand.
 */
export async function GET(req: Request) {
  try {
    const me = await requireUser()
    const url = new URL(req.url)
    const courseId = url.searchParams.get("courseId")
    const from = url.searchParams.get("from")
    const to = url.searchParams.get("to")

    const scope = await courseScope(me)
    if (courseId && !scope.unrestricted && !scope.ids.includes(courseId)) {
      throw new ApiError(403, "You don't have access to that course")
    }

    const window: Record<string, Date> = {}
    if (from) window.$gte = new Date(from)
    if (to) window.$lte = new Date(to)

    const base = courseId ? { course: courseId } : courseFilter(scope, { includeSchoolWide: true })
    const filter: Record<string, unknown> = { ...base }
    if (from || to) filter.start = window

    const events = await CalendarEvent.find(filter)
      .populate("course", "title code")
      .populate("createdBy", "name")
      .sort({ start: 1 })
      .lean()

    // Assignment deadlines, shown alongside but not editable from the calendar.
    const assignmentFilter: Record<string, unknown> = courseId
      ? { course: courseId }
      : scope.unrestricted
        ? {}
        : { course: { $in: scope.ids } }
    if (from || to) assignmentFilter.dueDate = window
    // Students must not see deadlines for work that hasn't been published.
    if (!hasRole(me, "teacher", "admin")) assignmentFilter.status = "published"

    const assignments = await Assignment.find(assignmentFilter)
      .select("title dueDate course points")
      .populate("course", "title code")
      .sort({ dueDate: 1 })
      .lean()

    return json({
      events: events.map((e) => ({ ...e, source: "event" as const })),
      deadlines: assignments.map((a) => ({
        _id: String(a._id),
        title: a.title,
        start: a.dueDate,
        type: "assignment" as const,
        course: a.course,
        points: a.points,
        source: "assignment" as const,
      })),
    })
  } catch (err) {
    return handleErrors(err)
  }
}

const createSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(5000).optional(),
  type: z.enum(["class", "assignment", "exam", "meeting", "holiday", "event"]).default("event"),
  start: z.coerce.date(),
  end: z.coerce.date().optional(),
  allDay: z.boolean().default(false),
  location: z.string().max(200).optional(),
  course: z.string().optional(),
})

/**
 * POST /api/events — teachers and admins add events.
 *
 * A teacher may only put an event on a course they teach; school-wide events
 * (no course) are open to both, since a teacher announcing a field trip is
 * ordinary. Students read the calendar rather than write to it.
 */
export async function POST(req: Request) {
  try {
    const me = await requireRole("teacher", "admin")
    const body = await parseBody(req, createSchema)

    if (body.end && body.end < body.start) {
      throw new ApiError(400, "The end time can't be before the start time")
    }

    if (body.course) {
      const course = await Course.findById(body.course).select("instructor")
      if (!course) throw new ApiError(404, "Course not found")
      if (String(course.instructor) !== me.id && !hasRole(me, "admin")) {
        throw new ApiError(403, "You can only add events to your own courses")
      }
    }

    const event = await CalendarEvent.create({ ...body, createdBy: me.id })
    const populated = await CalendarEvent.findById(event._id)
      .populate("course", "title code")
      .populate("createdBy", "name")
      .lean()

    return json(populated, 201)
  } catch (err) {
    return handleErrors(err)
  }
}
