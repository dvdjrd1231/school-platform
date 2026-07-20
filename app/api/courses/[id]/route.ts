import { z } from "zod"

import { Course, Enrollment } from "@/lib/models"
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

/** GET /api/courses/:id — full course including modules and lessons. */
export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params
    assertObjectId(id, "course id")
    const me = await requireUser()

    const course = await Course.findById(id).populate("instructor", "name email avatar bio").lean()
    if (!course) throw new ApiError(404, "Course not found")

    // Students may only read courses they're enrolled in.
    if (!hasRole(me, "admin", "teacher")) {
      const enrolled = await Enrollment.exists({ student: me.id, course: id })
      if (!enrolled) throw new ApiError(403, "You are not enrolled in this course")
    }

    return json(course)
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
  maxStudents: z.number().int().min(1).max(1000).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  status: z.enum(["draft", "active", "completed", "upcoming", "archived"]).optional(),
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
    Object.assign(course, body)
    await course.save()

    return json(course.toObject())
  } catch (err) {
    return handleErrors(err)
  }
}

/** DELETE /api/courses/:id — archives rather than deletes, preserving grades. */
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id } = await params
    assertObjectId(id, "course id")
    const me = await requireUser()

    const course = await Course.findById(id)
    if (!course) throw new ApiError(404, "Course not found")

    const isOwner = String(course.instructor) === me.id
    if (!isOwner && !hasRole(me, "admin")) {
      throw new ApiError(403, "Only the course instructor or an admin can archive this course")
    }

    course.status = "archived"
    await course.save()
    return json({ id, status: "archived" })
  } catch (err) {
    return handleErrors(err)
  }
}
