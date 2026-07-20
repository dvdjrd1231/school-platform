import { z } from "zod"

import { Assignment, Course, Notification, Submission } from "@/lib/models"
import { applyLatePenalty } from "@/lib/services/grading"
import {
  ApiError,
  assertObjectId,
  handleErrors,
  hasRole,
  json,
  parseBody,
  requireRole,
} from "@/lib/api/helpers"

export const runtime = "nodejs"

type Params = { params: Promise<{ id: string }> }

const gradeSchema = z.object({
  score: z.number().min(0),
  feedback: z.string().max(10_000).optional(),
  /** Set false to grade without notifying the student yet. */
  release: z.boolean().default(true),
  /** Override the automatic late penalty for this submission. */
  waiveLatePenalty: z.boolean().default(false),
})

/**
 * POST /api/submissions/:id/grade
 *
 * The posted score is the raw score out of the assignment's points. The stored
 * `score` has any late penalty applied; `rawScore` keeps what the teacher
 * actually entered so the deduction stays auditable.
 */
export async function POST(req: Request, { params }: Params) {
  try {
    const { id } = await params
    assertObjectId(id, "submission id")
    const me = await requireRole("teacher", "admin")
    const body = await parseBody(req, gradeSchema)

    const submission = await Submission.findById(id)
    if (!submission) throw new ApiError(404, "Submission not found")

    const assignment = await Assignment.findById(submission.assignment)
    if (!assignment) throw new ApiError(404, "Assignment not found")

    const course = await Course.findById(submission.course).select("instructor title")
    if (!course) throw new ApiError(404, "Course not found")
    if (String(course.instructor) !== me.id && !hasRole(me, "admin")) {
      throw new ApiError(403, "You can only grade submissions in your own courses")
    }

    if (body.score > assignment.points) {
      throw new ApiError(400, `Score cannot exceed the assignment total of ${assignment.points}`)
    }

    const finalScore =
      submission.isLate && !body.waiveLatePenalty
        ? applyLatePenalty(
            body.score,
            assignment.points,
            submission.daysLate,
            assignment.latePenaltyPerDay,
          )
        : body.score

    submission.rawScore = body.score
    submission.score = finalScore
    submission.feedback = body.feedback
    submission.gradedBy = me.id as never
    submission.gradedAt = new Date()
    submission.status = body.release ? "graded" : "submitted"
    await submission.save()

    if (body.release) {
      const pct = assignment.points > 0 ? Math.round((finalScore / assignment.points) * 100) : 0
      await Notification.create({
        user: submission.student,
        title: "Assignment graded",
        message: `${assignment.title} was graded: ${finalScore}/${assignment.points} (${pct}%).`,
        type: "grade",
        priority: "high",
        actionUrl: `/grades`,
        relatedId: assignment._id,
      })
    }

    return json({
      id: submission._id.toString(),
      rawScore: submission.rawScore,
      score: submission.score,
      penaltyApplied: body.score - finalScore,
      status: submission.status,
    })
  } catch (err) {
    return handleErrors(err)
  }
}
