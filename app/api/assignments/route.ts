import { z } from "zod"

import { Assignment, Course, Enrollment, Notification } from "@/lib/models"
import {
  ApiError,
  handleErrors,
  hasRole,
  json,
  parseBody,
  requireRole,
  requireUser,
} from "@/lib/api/helpers"

export const runtime = "nodejs"

/** GET /api/assignments — scoped to the caller's courses. */
export async function GET(req: Request) {
  try {
    const me = await requireUser()
    const url = new URL(req.url)
    const courseId = url.searchParams.get("courseId")

    const filter: Record<string, unknown> = {}
    if (courseId) filter.course = courseId

    if (hasRole(me, "admin")) {
      // No additional scoping.
    } else if (hasRole(me, "teacher")) {
      const courses = await Course.find({ instructor: me.id }).select("_id").lean()
      filter.course = courseId ?? { $in: courses.map((c) => c._id) }
    } else {
      const enrollments = await Enrollment.find({ student: me.id, status: "active" })
        .select("course")
        .lean()
      filter.course = courseId ?? { $in: enrollments.map((e) => e.course) }
      // Students must never see unpublished drafts.
      filter.status = "published"
    }

    const assignments = await Assignment.find(filter)
      .populate("course", "title code subject")
      .sort({ dueDate: 1 })
      .lean()

    return json({ assignments })
  } catch (err) {
    return handleErrors(err)
  }
}

const createSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(10_000).optional(),
  course: z.string().min(1),
  dueDate: z.coerce.date(),
  points: z.number().min(0).max(10_000),
  category: z
    .enum(["homework", "quiz", "exam", "project", "participation"])
    .default("homework"),
  status: z.enum(["draft", "published"]).default("draft"),
  allowLateSubmission: z.boolean().default(true),
  latePenaltyPerDay: z.number().min(0).max(100).default(10),
  attachments: z
    .array(z.object({ name: z.string(), url: z.string(), size: z.number().optional() }))
    .default([]),
})

/** POST /api/assignments — owning teacher or admin. Notifies enrolled students. */
export async function POST(req: Request) {
  try {
    const me = await requireRole("teacher", "admin")
    const body = await parseBody(req, createSchema)

    const course = await Course.findById(body.course).select("title instructor")
    if (!course) throw new ApiError(404, "Course not found")
    if (String(course.instructor) !== me.id && !hasRole(me, "admin")) {
      throw new ApiError(403, "You can only add assignments to your own courses")
    }

    const assignment = await Assignment.create({ ...body, createdBy: me.id })

    // Only announce work students can actually see.
    if (assignment.status === "published") {
      await notifyEnrolledStudents(body.course, course.title, assignment)
    }

    return json(assignment.toObject(), 201)
  } catch (err) {
    return handleErrors(err)
  }
}

async function notifyEnrolledStudents(
  courseId: string,
  courseTitle: string,
  assignment: { _id: unknown; title: string },
) {
  const enrollments = await Enrollment.find({ course: courseId, status: "active" })
    .select("student")
    .lean()
  if (enrollments.length === 0) return

  await Notification.insertMany(
    enrollments.map((e) => ({
      user: e.student,
      title: "New assignment posted",
      message: `${assignment.title} was posted in ${courseTitle}.`,
      type: "assignment",
      priority: "medium",
      actionUrl: `/assignments/${assignment._id}`,
      relatedId: assignment._id,
    })),
  )
}
