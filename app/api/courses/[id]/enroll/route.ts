import { z } from "zod"

import { Course, Enrollment, Notification, User } from "@/lib/models"
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

/** GET /api/courses/:id/enroll — roster. Staff only. */
export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params
    assertObjectId(id, "course id")
    const me = await requireUser()
    if (!hasRole(me, "teacher", "admin")) throw new ApiError(403, "Requires role: teacher or admin")

    const roster = await Enrollment.find({ course: id })
      .populate("student", "name email studentId gradeLevel avatar")
      .sort({ enrolledAt: 1 })
      .lean()

    return json({ roster, total: roster.length })
  } catch (err) {
    return handleErrors(err)
  }
}

const enrollSchema = z.object({
  /** Omit to enroll yourself. Staff may enroll another student by id. */
  studentId: z.string().optional(),
})

/**
 * POST /api/courses/:id/enroll
 *
 * Enforces capacity and prevents duplicate enrolment. The unique index on
 * (student, course) is the real guard against races; this check produces a
 * friendlier error in the common case.
 */
export async function POST(req: Request, { params }: Params) {
  try {
    const { id } = await params
    assertObjectId(id, "course id")
    const me = await requireUser()
    const body = await parseBody(req, enrollSchema)

    const targetStudent = body.studentId ?? me.id
    if (targetStudent !== me.id && !hasRole(me, "teacher", "admin")) {
      throw new ApiError(403, "You may only enroll yourself")
    }
    assertObjectId(targetStudent, "student id")

    const course = await Course.findById(id).select("title status maxStudents instructor")
    if (!course) throw new ApiError(404, "Course not found")
    if (!["active", "upcoming"].includes(course.status)) {
      throw new ApiError(400, `Course is ${course.status} and not open for enrollment`)
    }

    const student = await User.findById(targetStudent).select("name roles status")
    if (!student) throw new ApiError(404, "Student not found")
    if (student.status !== "active") throw new ApiError(400, "Student account is inactive")
    if (!student.roles.includes("student")) throw new ApiError(400, "That user is not a student")

    const existing = await Enrollment.findOne({ student: targetStudent, course: id })
    if (existing && existing.status !== "dropped") {
      throw new ApiError(409, "Already enrolled in this course")
    }

    const activeCount = await Enrollment.countDocuments({ course: id, status: "active" })
    if (activeCount >= course.maxStudents) {
      throw new ApiError(409, "Course is full")
    }

    // Re-activate a dropped enrolment rather than creating a second row, which
    // the unique index would reject anyway.
    const enrollment = existing
      ? await Enrollment.findByIdAndUpdate(
          existing._id,
          { status: "active", enrolledAt: new Date() },
          { new: true },
        )
      : await Enrollment.create({ student: targetStudent, course: id, status: "active" })

    await Notification.create({
      user: targetStudent,
      title: "Enrolled in course",
      message: `You have been enrolled in ${course.title}.`,
      type: "announcement",
      actionUrl: `/courses/${id}`,
      relatedId: course._id,
    })

    return json(enrollment, 201)
  } catch (err) {
    return handleErrors(err)
  }
}

/** DELETE /api/courses/:id/enroll — drop. Students may drop themselves. */
export async function DELETE(req: Request, { params }: Params) {
  try {
    const { id } = await params
    assertObjectId(id, "course id")
    const me = await requireUser()
    const studentId = new URL(req.url).searchParams.get("studentId") ?? me.id

    if (studentId !== me.id && !hasRole(me, "teacher", "admin")) {
      throw new ApiError(403, "You may only drop your own enrollment")
    }

    const enrollment = await Enrollment.findOneAndUpdate(
      { student: studentId, course: id },
      { status: "dropped" },
      { new: true },
    )
    if (!enrollment) throw new ApiError(404, "Enrollment not found")

    return json({ id: enrollment._id.toString(), status: "dropped" })
  } catch (err) {
    return handleErrors(err)
  }
}
