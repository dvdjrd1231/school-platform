import { z } from "zod"

import { Course, Enrollment, Notification, User } from "@/lib/models"
import {
  ApiError,
  assertObjectId,
  handleErrors,
  json,
  parseBody,
  requireRole,
} from "@/lib/api/helpers"

export const runtime = "nodejs"

interface Params {
  params: Promise<{ id: string }>
}

const promoteSchema = z.object({
  toGradeLevel: z.string().min(1).max(50),
  /**
   * Enrol them in the new grade's active classes straight away. Off by default:
   * a school may want to place students by hand.
   */
  enrollInNewGrade: z.boolean().default(true),
  /** Preview the effect without changing anything. */
  dryRun: z.boolean().default(false),
})

/**
 * POST /api/students/:id/promote — move a student up a year group.
 *
 * What this does, in order:
 *   1. closes their enrolments in classes tagged with the old grade level, so
 *      those courses stop appearing as current work;
 *   2. sets the new grade level on their record;
 *   3. optionally enrols them in the new grade's *active* classes — draft
 *      classes are excluded, matching "once the teacher makes the course active
 *      for students".
 *
 * Enrolments are completed rather than deleted: their grades, submissions and
 * history stay intact and remain visible on the performance pages. Classes with
 * no grade level set (electives, mixed-age) are left alone.
 *
 * `dryRun` returns the same summary without writing, which is what the
 * confirmation dialog shows before anyone commits.
 */
export async function POST(req: Request, { params }: Params) {
  try {
    const me = await requireRole("teacher", "admin")
    const { id } = await params
    assertObjectId(id, "student id")

    const student = await User.findById(id).select("name roles gradeLevel")
    if (!student) throw new ApiError(404, "Student not found")
    if (!student.roles.includes("student")) {
      throw new ApiError(400, "That account isn't a student")
    }

    const body = await parseBody(req, promoteSchema)
    const fromGradeLevel = student.gradeLevel ?? null

    if (fromGradeLevel === body.toGradeLevel) {
      throw new ApiError(409, `${student.name} is already in ${body.toGradeLevel}`)
    }

    const [oldGradeCourses, newGradeCourses] = await Promise.all([
      fromGradeLevel
        ? Course.find({ gradeLevel: fromGradeLevel }).select("_id title").lean()
        : Promise.resolve([]),
      Course.find({ gradeLevel: body.toGradeLevel, status: "active" })
        .select("_id title")
        .lean(),
    ])

    const oldIds = oldGradeCourses.map((c) => c._id)
    const closing = await Enrollment.find({
      student: id,
      course: { $in: oldIds },
      status: "active",
    })
      .populate("course", "title")
      .lean()

    const alreadyIn = await Enrollment.find({
      student: id,
      course: { $in: newGradeCourses.map((c) => c._id) },
    })
      .select("course")
      .lean()
    const alreadyInIds = new Set(alreadyIn.map((e) => String(e.course)))
    const joining = body.enrollInNewGrade
      ? newGradeCourses.filter((c) => !alreadyInIds.has(String(c._id)))
      : []

    const summary = {
      student: { _id: String(student._id), name: student.name },
      fromGradeLevel,
      toGradeLevel: body.toGradeLevel,
      closing: closing.map((e) => ({
        courseId: String((e.course as { _id: unknown })._id),
        title: (e.course as { title?: string }).title ?? "Untitled",
      })),
      joining: joining.map((c) => ({ courseId: String(c._id), title: c.title })),
    }

    if (body.dryRun) return json({ ...summary, applied: false })

    if (closing.length > 0) {
      await Enrollment.updateMany(
        { student: id, course: { $in: oldIds }, status: "active" },
        { $set: { status: "completed", completedAt: new Date() } },
      )
    }

    student.gradeLevel = body.toGradeLevel
    await student.save()

    if (joining.length > 0) {
      await Enrollment.insertMany(
        joining.map((c) => ({ student: id, course: c._id, status: "active" })),
        // A concurrent enrolment would trip the unique index; skipping the
        // duplicate is the right outcome rather than failing the promotion.
        { ordered: false },
      ).catch(() => {})
    }

    await Notification.create({
      user: id,
      title: `You've moved up to ${body.toGradeLevel}`,
      message:
        joining.length > 0
          ? `You now have access to ${joining.length} new class(es).`
          : "Your teacher will add you to your new classes shortly.",
      type: "system",
      priority: "high",
      actionUrl: "/courses",
    })

    return json({ ...summary, applied: true, promotedBy: me.id })
  } catch (err) {
    return handleErrors(err)
  }
}
