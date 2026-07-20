import { z } from "zod"

import { Assignment, Course, Enrollment, Submission } from "@/lib/models"
import { calculateDaysLate } from "@/lib/services/grading"
import {
  ApiError,
  handleErrors,
  hasRole,
  json,
  parseBody,
  requireUser,
} from "@/lib/api/helpers"

export const runtime = "nodejs"

/** GET /api/submissions — students see their own; staff see the course's. */
export async function GET(req: Request) {
  try {
    const me = await requireUser()
    const url = new URL(req.url)
    const assignmentId = url.searchParams.get("assignmentId")
    const courseId = url.searchParams.get("courseId")

    const filter: Record<string, unknown> = {}
    if (assignmentId) filter.assignment = assignmentId
    if (courseId) filter.course = courseId

    if (!hasRole(me, "teacher", "admin")) {
      filter.student = me.id
    }

    const submissions = await Submission.find(filter)
      .populate("student", "name email studentId avatar")
      .populate("assignment", "title points dueDate category")
      .sort({ submittedAt: -1 })
      .lean()

    return json({ submissions })
  } catch (err) {
    return handleErrors(err)
  }
}

const submitSchema = z.object({
  assignment: z.string().min(1),
  content: z.string().max(50_000).optional(),
  files: z
    .array(z.object({ name: z.string(), url: z.string(), size: z.number().optional() }))
    .default([]),
})

/**
 * POST /api/submissions — student turns work in.
 *
 * Upserts so resubmission before the deadline replaces the previous attempt
 * rather than colliding with the unique (assignment, student) index.
 */
export async function POST(req: Request) {
  try {
    const me = await requireUser()
    const body = await parseBody(req, submitSchema)

    const assignment = await Assignment.findById(body.assignment)
    if (!assignment) throw new ApiError(404, "Assignment not found")
    if (assignment.status !== "published") {
      throw new ApiError(400, "This assignment is not open for submissions")
    }

    const enrolled = await Enrollment.exists({
      student: me.id,
      course: assignment.course,
      status: "active",
    })
    if (!enrolled) throw new ApiError(403, "You are not enrolled in this course")

    const now = new Date()
    const daysLate = calculateDaysLate(now, assignment.dueDate)
    if (daysLate > 0 && !assignment.allowLateSubmission) {
      throw new ApiError(400, "The deadline has passed and late submissions are not accepted")
    }

    // Don't let a student overwrite work a teacher has already graded.
    const existing = await Submission.findOne({ assignment: body.assignment, student: me.id })
    if (existing && (existing.status === "graded" || existing.status === "returned")) {
      throw new ApiError(409, "This submission has already been graded and cannot be changed")
    }

    const submission = await Submission.findOneAndUpdate(
      { assignment: body.assignment, student: me.id },
      {
        assignment: body.assignment,
        student: me.id,
        course: assignment.course,
        content: body.content,
        files: body.files,
        status: "submitted",
        submittedAt: now,
        isLate: daysLate > 0,
        daysLate,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    )

    return json(submission.toObject(), 201)
  } catch (err) {
    return handleErrors(err)
  }
}
