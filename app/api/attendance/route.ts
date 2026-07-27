import { z } from "zod"
import { Types } from "mongoose"

import { Assignment, Attendance, Course, Enrollment, Submission } from "@/lib/models"
import { ATTENDANCE_STATUSES } from "@/lib/models/Attendance"
import {
  ApiError,
  handleErrors,
  hasRole,
  json,
  parseBody,
  requireRole,
  requireUser,
} from "@/lib/api/helpers"
import { childrenOf, courseScope } from "@/lib/api/scope"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** Normalise any timestamp to midnight, so a day has exactly one key. */
function startOfDay(value: string | Date): Date {
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)
  return date
}

/**
 * GET /api/attendance?courseId=…&date=…      — the register for one day
 * GET /api/attendance?courseId=…&summary=1   — each student's record so far
 * GET /api/attendance?studentId=…            — one student's history
 *
 * The client's rule is that attendance is only meaningful once a student has
 * actually handed something in, so every response carries `hasSubmitted` and the
 * summary reports a rate of null — not 0% — for students who haven't yet. A
 * student with no submitted work shouldn't read as 0% attendance.
 */
export async function GET(req: Request) {
  try {
    const me = await requireUser()
    const url = new URL(req.url)
    const courseId = url.searchParams.get("courseId")
    const studentId = url.searchParams.get("studentId")
    const date = url.searchParams.get("date")
    const summary = url.searchParams.get("summary") === "1"

    const scope = await courseScope(me)
    if (courseId && !scope.unrestricted && !scope.ids.includes(courseId)) {
      throw new ApiError(403, "You don't have access to that class")
    }

    // A parent may read their own children's attendance; a student their own.
    if (studentId && studentId !== me.id && !hasRole(me, "teacher", "admin")) {
      const children = await childrenOf(me.id)
      if (!children.includes(studentId)) {
        throw new ApiError(403, "You can only view your own children's attendance")
      }
    }

    if (studentId && !courseId) {
      const records = await Attendance.find({ student: studentId })
        .populate("course", "title code")
        .sort({ date: -1 })
        .limit(365)
        .lean()
      return json({ records })
    }

    if (!courseId) throw new ApiError(400, "courseId or studentId is required")

    const enrollments = await Enrollment.find({ course: courseId, status: "active" })
      .populate("student", "name email avatar gradeLevel")
      .lean()
    const studentIds = enrollments.map((e) =>
      Types.ObjectId.createFromHexString(String((e.student as { _id: unknown })._id)),
    )

    // Which of these students have handed anything in for this class at all.
    const assignments = await Assignment.find({ course: courseId }).select("_id").lean()
    const submitted = await Submission.distinct("student", {
      assignment: { $in: assignments.map((a) => a._id) },
      student: { $in: studentIds },
    })
    const hasSubmitted = new Set(submitted.map(String))

    if (summary) {
      const records = await Attendance.find({ course: courseId }).lean()
      const byStudent = new Map<string, { present: number; total: number }>()

      for (const record of records) {
        const key = String(record.student)
        const entry = byStudent.get(key) ?? { present: 0, total: 0 }
        entry.total += 1
        // Late still counts as attending; excused is neither present nor a mark
        // against the student, so it's left out of the denominator entirely.
        if (record.status === "present" || record.status === "late") entry.present += 1
        if (record.status === "excused") entry.total -= 1
        byStudent.set(key, entry)
      }

      return json({
        students: enrollments.map((e) => {
          const student = e.student as { _id: unknown; name?: string; email?: string }
          const key = String(student._id)
          const entry = byStudent.get(key) ?? { present: 0, total: 0 }
          const eligible = hasSubmitted.has(key)

          return {
            student,
            present: entry.present,
            recorded: entry.total,
            hasSubmitted: eligible,
            // Null rather than 0 for a student with no submitted work.
            rate:
              eligible && entry.total > 0
                ? Math.round((entry.present / entry.total) * 100)
                : null,
          }
        }),
      })
    }

    const day = startOfDay(date ?? new Date())
    const records = await Attendance.find({ course: courseId, date: day }).lean()
    const byStudent = new Map(records.map((r) => [String(r.student), r]))

    return json({
      date: day.toISOString(),
      register: enrollments.map((e) => {
        const student = e.student as { _id: unknown; name?: string; email?: string }
        const key = String(student._id)
        return {
          student,
          status: byStudent.get(key)?.status ?? null,
          note: byStudent.get(key)?.note ?? "",
          hasSubmitted: hasSubmitted.has(key),
        }
      }),
    })
  } catch (err) {
    return handleErrors(err)
  }
}

const saveSchema = z.object({
  courseId: z.string(),
  date: z.coerce.date(),
  marks: z
    .array(
      z.object({
        student: z.string(),
        status: z.enum(ATTENDANCE_STATUSES),
        note: z.string().max(500).optional(),
      }),
    )
    .min(1),
})

/**
 * POST /api/attendance — save a day's register.
 *
 * Upserts, so re-saving the same day corrects it rather than duplicating it.
 */
export async function POST(req: Request) {
  try {
    const me = await requireRole("teacher", "admin")
    const body = await parseBody(req, saveSchema)

    const course = await Course.findById(body.courseId).select("instructor")
    if (!course) throw new ApiError(404, "Class not found")
    if (String(course.instructor) !== me.id && !hasRole(me, "admin")) {
      throw new ApiError(403, "You can only take attendance for your own classes")
    }

    const day = startOfDay(body.date)

    await Attendance.bulkWrite(
      body.marks.map((mark) => ({
        updateOne: {
          filter: {
            course: Types.ObjectId.createFromHexString(body.courseId),
            student: Types.ObjectId.createFromHexString(mark.student),
            date: day,
          },
          update: {
            $set: {
              status: mark.status,
              note: mark.note ?? "",
              recordedBy: Types.ObjectId.createFromHexString(me.id),
            },
          },
          upsert: true,
        },
      })),
    )

    return json({ courseId: body.courseId, date: day.toISOString(), saved: body.marks.length })
  } catch (err) {
    return handleErrors(err)
  }
}
