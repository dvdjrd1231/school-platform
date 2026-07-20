import { z } from "zod"

import { Course, Enrollment } from "@/lib/models"
import { handleErrors, hasRole, json, parseBody, requireRole, requireUser } from "@/lib/api/helpers"

export const runtime = "nodejs"

/**
 * GET /api/courses
 *
 * Scoped to the caller: students see courses they're enrolled in, teachers see
 * courses they instruct, admins see everything.
 */
export async function GET(req: Request) {
  try {
    const me = await requireUser()
    const url = new URL(req.url)
    const status = url.searchParams.get("status")
    const all = url.searchParams.get("all") === "true"

    const filter: Record<string, unknown> = {}
    if (status) filter.status = status

    if (!hasRole(me, "admin") && !all) {
      if (hasRole(me, "teacher")) {
        filter.instructor = me.id
      } else {
        const enrollments = await Enrollment.find({
          student: me.id,
          status: { $in: ["active", "completed"] },
        })
          .select("course")
          .lean()
        filter._id = { $in: enrollments.map((e) => e.course) }
      }
    }

    const courses = await Course.find(filter)
      .populate("instructor", "name email avatar")
      // Module content can be large; the list view only needs metadata.
      .select("-modules")
      .sort({ createdAt: -1 })
      .lean()

    // Attach live enrolment counts without an N+1 query.
    const counts = await Enrollment.aggregate<{ _id: unknown; count: number }>([
      { $match: { course: { $in: courses.map((c) => c._id) }, status: "active" } },
      { $group: { _id: "$course", count: { $sum: 1 } } },
    ])
    const countMap = new Map(counts.map((c) => [String(c._id), c.count]))

    return json({
      courses: courses.map((c) => ({ ...c, enrolledCount: countMap.get(String(c._id)) ?? 0 })),
    })
  } catch (err) {
    return handleErrors(err)
  }
}

const createCourseSchema = z.object({
  code: z.string().min(2).max(20),
  title: z.string().min(2).max(200),
  description: z.string().max(5000).optional(),
  subject: z.string().min(1),
  instructor: z.string().optional(),
  schedule: z.string().optional(),
  room: z.string().optional(),
  maxStudents: z.number().int().min(1).max(1000).default(30),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  status: z.enum(["draft", "active", "upcoming"]).default("draft"),
})

/** POST /api/courses — teachers create their own; admins may assign an instructor. */
export async function POST(req: Request) {
  try {
    const me = await requireRole("teacher", "admin")
    const body = await parseBody(req, createCourseSchema)

    // A teacher can only create courses they own, regardless of what they post.
    const instructor = hasRole(me, "admin") && body.instructor ? body.instructor : me.id

    const course = await Course.create({ ...body, instructor, modules: [] })
    return json(course.toObject(), 201)
  } catch (err) {
    return handleErrors(err)
  }
}
