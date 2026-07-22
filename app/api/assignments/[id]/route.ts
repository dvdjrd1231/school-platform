import { z } from "zod"

import { Assignment, Course, Enrollment, Notification, Submission } from "@/lib/models"
import {
  ApiError,
  assertObjectId,
  handleErrors,
  hasRole,
  json,
  parseBody,
  requireUser,
} from "@/lib/api/helpers"

export const runtime = "nodejs"

type Params = { params: Promise<{ id: string }> }

/**
 * Load an assignment and assert the caller may act on it.
 * Returns the assignment plus whether the caller can modify it.
 */
async function loadAndAuthorize(id: string, me: { id: string; roles: string[] }) {
  const assignment = await Assignment.findById(id)
  if (!assignment) throw new ApiError(404, "Assignment not found")

  const course = await Course.findById(assignment.course).select("instructor title")
  if (!course) throw new ApiError(404, "Course not found")

  const isAdmin = hasRole(me as never, "admin")
  const isOwner = String(course.instructor) === me.id
  return { assignment, course, canModify: isOwner || isAdmin }
}

/** GET /api/assignments/:id */
export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params
    assertObjectId(id, "assignment id")
    const me = await requireUser()

    const { assignment, canModify } = await loadAndAuthorize(id, me)

    if (!canModify) {
      // Students may only read published assignments in courses they're in.
      const enrolled = await Enrollment.exists({
        student: me.id,
        course: assignment.course,
        status: "active",
      })
      if (!enrolled) throw new ApiError(403, "You are not enrolled in this course")
      if (assignment.status !== "published") throw new ApiError(404, "Assignment not found")
    }

    await assignment.populate("course", "title code subject")
    return json(assignment.toObject())
  } catch (err) {
    return handleErrors(err)
  }
}

const updateSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  description: z.string().max(10_000).optional(),
  dueDate: z.coerce.date().optional(),
  points: z.number().min(0).max(10_000).optional(),
  category: z.enum(["homework", "quiz", "exam", "project", "participation"]).optional(),
  status: z.enum(["draft", "published", "closed"]).optional(),
  allowLateSubmission: z.boolean().optional(),
  latePenaltyPerDay: z.number().min(0).max(100).optional(),
  attachments: z
    .array(z.object({ name: z.string(), url: z.string(), size: z.number().optional() }))
    .optional(),
})

/**
 * PATCH /api/assignments/:id — owning teacher or admin.
 *
 * Publishing a previously unpublished assignment notifies enrolled students,
 * matching the behaviour of creating one already published.
 */
export async function PATCH(req: Request, { params }: Params) {
  try {
    const { id } = await params
    assertObjectId(id, "assignment id")
    const me = await requireUser()

    const { assignment, course, canModify } = await loadAndAuthorize(id, me)
    if (!canModify) {
      throw new ApiError(403, "Only the course instructor or an admin can edit this assignment")
    }

    const body = await parseBody(req, updateSchema)

    // Reducing the total points below an already-awarded score would leave
    // students with impossible grades like 95/50.
    if (body.points !== undefined && body.points < assignment.points) {
      const highest = await Submission.findOne({ assignment: id, score: { $gt: body.points } })
        .select("score")
        .lean()
      if (highest) {
        throw new ApiError(
          400,
          `Cannot lower points to ${body.points}: a submission is already graded ${highest.score}`,
        )
      }
    }

    const wasPublished = assignment.status === "published"
    Object.assign(assignment, body)
    await assignment.save()

    if (!wasPublished && assignment.status === "published") {
      const enrollments = await Enrollment.find({ course: assignment.course, status: "active" })
        .select("student")
        .lean()
      if (enrollments.length > 0) {
        await Notification.insertMany(
          enrollments.map((e) => ({
            user: e.student,
            title: "New assignment posted",
            message: `${assignment.title} was posted in ${course.title}.`,
            type: "assignment",
            priority: "medium",
            actionUrl: `/classrooms/assignments/${assignment._id}`,
            relatedId: assignment._id,
          })),
        )
      }
    }

    return json(assignment.toObject())
  } catch (err) {
    return handleErrors(err)
  }
}

/**
 * DELETE /api/assignments/:id — owning teacher or admin.
 *
 * Only removed outright when nothing has been submitted. Once submissions
 * exist, deleting would orphan student work and grades, so the assignment is
 * closed instead (hidden from new submissions, history preserved).
 */
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id } = await params
    assertObjectId(id, "assignment id")
    const me = await requireUser()

    const { assignment, canModify } = await loadAndAuthorize(id, me)
    if (!canModify) {
      throw new ApiError(403, "Only the course instructor or an admin can delete this assignment")
    }

    const submissionCount = await Submission.countDocuments({ assignment: id })

    if (submissionCount > 0) {
      assignment.status = "closed"
      await assignment.save()
      return json({
        id,
        deleted: false,
        status: "closed",
        message: `Kept and closed: ${submissionCount} submission(s) reference this assignment.`,
      })
    }

    await assignment.deleteOne()
    return json({ id, deleted: true })
  } catch (err) {
    return handleErrors(err)
  }
}
