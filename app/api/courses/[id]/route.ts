import { z } from "zod"

import { Course, Enrollment, User } from "@/lib/models"
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
 * GET /api/courses/:id — full course including modules and lessons.
 *
 * Also returns a `viewer` block: which lessons this person has completed, their
 * progress, and whether they may edit. The course page needs all of that to draw
 * tick/lock states, and fetching it here avoids a second round trip.
 */
export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params
    assertObjectId(id, "course id")
    const me = await requireUser()

    const course = await Course.findById(id).populate("instructor", "name email avatar bio").lean()
    if (!course) throw new ApiError(404, "Course not found")

    const isOwner = String((course.instructor as { _id?: unknown })?._id ?? course.instructor) === me.id
    const canEdit = isOwner || hasRole(me, "admin")

    // A teacher who doesn't own the course is treated like any other reader:
    // they still need an enrolment, so one teacher can't browse another's class.
    const enrollment = await Enrollment.findOne({ student: me.id, course: id })
      .select("completedLessons progress status")
      .lean()
    if (!canEdit && !enrollment) throw new ApiError(403, "You are not enrolled in this course")

    const lessonCount = (course.modules ?? []).reduce((n, m) => n + (m.lessons?.length ?? 0), 0)

    return json({
      ...course,
      viewer: {
        canEdit,
        enrolled: Boolean(enrollment),
        progress: enrollment?.progress ?? 0,
        completedLessonIds: (enrollment?.completedLessons ?? []).map(String),
        lessonCount,
      },
    })
  } catch (err) {
    return handleErrors(err)
  }
}

const lessonSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(["video", "reading", "interactive", "quiz", "assignment"]).default("reading"),
  duration: z.string().optional(),
  order: z.number().int().min(0),
  content: z.string().optional(),
  videoUrl: z.string().url().optional(),
  materials: z
    .array(z.object({ name: z.string(), url: z.string(), size: z.number().optional() }))
    .default([]),
})

const moduleSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  order: z.number().int().min(0),
  status: z.enum(["locked", "available", "in-progress", "completed"]).default("available"),
  unlockDate: z.coerce.date().optional(),
  lessons: z.array(lessonSchema).default([]),
})

const updateCourseSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  description: z.string().max(5000).optional(),
  subject: z.string().optional(),
  schedule: z.string().optional(),
  room: z.string().optional(),
  gradeLevel: z.string().max(50).optional(),
  maxStudents: z.number().int().min(1).max(1000).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  status: z.enum(["draft", "active", "completed", "upcoming", "archived"]).optional(),
  /** Reassign the teacher. Admin-only — enforced in the handler. */
  instructor: z.string().optional(),
  /** Replaces the whole module tree — this is the course-content upload path. */
  modules: z.array(moduleSchema).optional(),
})

/** PATCH /api/courses/:id — owning teacher or admin. */
export async function PATCH(req: Request, { params }: Params) {
  try {
    const { id } = await params
    assertObjectId(id, "course id")
    const me = await requireUser()

    const course = await Course.findById(id)
    if (!course) throw new ApiError(404, "Course not found")

    const isOwner = String(course.instructor) === me.id
    if (!isOwner && !hasRole(me, "admin")) {
      throw new ApiError(403, "Only the course instructor or an admin can edit this course")
    }

    const body = await parseBody(req, updateCourseSchema)

    // Reassigning the teacher is an admin-only action: a teacher must not be
    // able to hand their course to someone else. Drop it silently for non-admins
    // rather than fail the whole edit.
    if (body.instructor !== undefined && !hasRole(me, "admin")) {
      delete body.instructor
    }
    if (body.instructor) {
      const teacher = await User.findById(body.instructor).select("roles").lean()
      if (!teacher || !teacher.roles.some((r) => r === "teacher" || r === "admin")) {
        throw new ApiError(400, "New instructor must be a teacher or admin")
      }
    }

    Object.assign(course, body)
    await course.save()

    return json(course.toObject())
  } catch (err) {
    return handleErrors(err)
  }
}

/**
 * DELETE /api/courses/:id
 *
 * Default: archive (reversible, preserves grades).
 * `?hard=true`: permanently delete — allowed only when the class is empty, i.e.
 * no enrolled students and no lessons, matching the rule "remove all lessons and
 * students first." Otherwise it's refused with a message.
 */
export async function DELETE(req: Request, { params }: Params) {
  try {
    const { id } = await params
    assertObjectId(id, "course id")
    const me = await requireUser()

    const course = await Course.findById(id)
    if (!course) throw new ApiError(404, "Course not found")

    const isOwner = String(course.instructor) === me.id
    if (!isOwner && !hasRole(me, "admin")) {
      throw new ApiError(403, "Only the course instructor or an admin can remove this course")
    }

    const hard = new URL(req.url).searchParams.get("hard") === "true"

    if (hard) {
      const [enrolled, lessonCount] = await Promise.all([
        Enrollment.countDocuments({ course: id, status: { $ne: "dropped" } }),
        Promise.resolve(course.modules.reduce((n, m) => n + (m.lessons?.length ?? 0), 0)),
      ])
      if (enrolled > 0 || lessonCount > 0) {
        throw new ApiError(
          409,
          `Remove all students and lessons first (${enrolled} enrolled, ${lessonCount} lesson(s)).`,
        )
      }
      await course.deleteOne()
      return json({ id, deleted: true })
    }

    course.status = "archived"
    await course.save()
    return json({ id, status: "archived" })
  } catch (err) {
    return handleErrors(err)
  }
}
