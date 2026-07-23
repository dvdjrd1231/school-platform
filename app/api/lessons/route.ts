import { z } from "zod"
import { Types } from "mongoose"

import { Course } from "@/lib/models"
import {
  ApiError,
  handleErrors,
  hasRole,
  json,
  parseBody,
  requireRole,
} from "@/lib/api/helpers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Lessons live embedded inside course modules (Course.modules[].lessons), so
 * there is no lessons collection to query. This route flattens them into a flat
 * list for the admin lesson manager, and appends new ones to a module.
 */

/** GET /api/lessons — flattened across courses. Admin sees all; teacher sees own. */
export async function GET() {
  try {
    const me = await requireRole("teacher", "admin")

    const filter = hasRole(me, "admin") ? {} : { instructor: me.id }
    const courses = await Course.find(filter)
      .select("code title modules")
      .populate("instructor", "name")
      .lean()

    const lessons = courses.flatMap((c) =>
      (c.modules ?? []).flatMap((m) =>
        (m.lessons ?? []).map((l) => ({
          lessonId: String(l._id),
          title: l.title,
          type: l.type,
          duration: l.duration ?? null,
          order: l.order,
          courseId: String(c._id),
          courseCode: c.code,
          courseTitle: c.title,
          moduleId: String(m._id),
          moduleTitle: m.title,
        })),
      ),
    )

    return json({ lessons, courseCount: courses.length })
  } catch (err) {
    return handleErrors(err)
  }
}

const createSchema = z.object({
  courseId: z.string(),
  /** Append to this module; omit to create a new module named `moduleTitle`. */
  moduleId: z.string().optional(),
  moduleTitle: z.string().optional(),
  title: z.string().min(2).max(200),
  type: z.enum(["video", "reading", "interactive", "quiz", "assignment"]).default("reading"),
  duration: z.string().optional(),
  content: z.string().optional(),
  videoUrl: z.string().url().optional(),
})

/**
 * POST /api/lessons — add a lesson to a course module.
 *
 * Owning teacher or admin only. Order is assigned as (last order + 1) within
 * the target module so lessons keep a stable sequence.
 */
export async function POST(req: Request) {
  try {
    const me = await requireRole("teacher", "admin")
    const body = await parseBody(req, createSchema)

    const course = await Course.findById(body.courseId)
    if (!course) throw new ApiError(404, "Course not found")
    if (String(course.instructor) !== me.id && !hasRole(me, "admin")) {
      throw new ApiError(403, "You can only add lessons to your own courses")
    }

    // Resolve the target module, creating one when none is specified.
    let mod = body.moduleId
      ? course.modules.find((m) => String(m._id) === body.moduleId)
      : undefined

    if (!mod) {
      const title = body.moduleTitle?.trim() || "General"
      mod = course.modules.find((m) => m.title === title)
      if (!mod) {
        course.modules.push({
          title,
          order: course.modules.length,
          status: "available",
          lessons: [],
        } as never)
        mod = course.modules[course.modules.length - 1]
      }
    }

    const nextOrder = mod.lessons.reduce((max, l) => Math.max(max, l.order ?? 0), -1) + 1
    mod.lessons.push({
      _id: new Types.ObjectId(),
      title: body.title,
      type: body.type,
      duration: body.duration,
      order: nextOrder,
      content: body.content,
      videoUrl: body.videoUrl,
      materials: [],
    } as never)

    await course.save()

    const created = mod.lessons[mod.lessons.length - 1]
    return json(
      {
        lessonId: String(created._id),
        title: created.title,
        courseId: String(course._id),
        moduleId: String(mod._id),
      },
      201,
    )
  } catch (err) {
    return handleErrors(err)
  }
}
