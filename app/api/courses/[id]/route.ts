import { z } from "zod"

import { Assignment, Course, Enrollment, User } from "@/lib/models"
import { normaliseLesson } from "@/lib/lessons/normalise"
import { visibleToStudents } from "@/lib/services/lessons"
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

    // Lessons come back in the typed shape, and drafts (or lessons not yet
    // released) are removed entirely for students rather than hidden in the UI —
    // a title in the network response is still a leak.
    const modules = (course.modules ?? []).map((m) => ({
      ...m,
      _id: String(m._id),
      lessons: (m.lessons ?? [])
        .map(normaliseLesson)
        .filter((lesson) => canEdit || visibleToStudents(lesson)),
    }))

    const lessonCount = modules.reduce((n, m) => n + m.lessons.length, 0)

    // Points and due dates for assignment lessons, so the module list can label
    // the cards without a request per lesson.
    const assignmentIds = modules
      .flatMap((m) => m.lessons)
      .map((l) => l.assignment?.assignmentId)
      .filter((value): value is string => Boolean(value))

    const assignments = await Assignment.find({ _id: { $in: assignmentIds } })
      .select("points dueDate status")
      .lean()
    const assignmentById = new Map(assignments.map((a) => [String(a._id), a]))

    const withMeta = modules.map((m) => ({
      ...m,
      lessons: m.lessons.map((lesson) => {
        const assignment = lesson.assignment?.assignmentId
          ? assignmentById.get(lesson.assignment.assignmentId)
          : undefined
        return {
          ...lesson,
          points: assignment?.points ?? null,
          dueDate: assignment?.dueDate ?? null,
        }
      }),
    }))

    return json({
      ...course,
      modules: withMeta,
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

/**
 * Modules can be renamed and reordered here, but their lessons cannot be
 * written through this route.
 *
 * Lessons are type-specific now, and each one may own a linked Quiz or
 * Assignment. A whole-tree replace would have to reproduce all of that
 * correctly or it would quietly strip typed payloads and orphan the linked
 * records. Lessons go through /api/lessons, which validates per type.
 */
const moduleSchema = z.object({
  _id: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  order: z.number().int().min(0),
  status: z.enum(["locked", "available", "in-progress", "completed"]).default("available"),
  unlockDate: z.coerce.date().optional(),
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
  /** Rename/reorder modules. Lessons inside them are left untouched. */
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

    // Modules are merged by id rather than assigned, because assigning the
    // array would replace each module wholesale — and the lessons live inside
    // it. A rename would silently delete a module's entire contents.
    const { modules, ...scalarFields } = body
    Object.assign(course, scalarFields)

    if (modules) {
      for (const incoming of modules) {
        const existing = incoming._id
          ? course.modules.find((m) => String(m._id) === incoming._id)
          : undefined

        if (existing) {
          existing.title = incoming.title
          existing.description = incoming.description
          existing.order = incoming.order
          existing.status = incoming.status
          existing.unlockDate = incoming.unlockDate
        } else {
          course.modules.push({ ...incoming, lessons: [] } as never)
        }
      }
    }

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
