import { z } from "zod"
import { Types } from "mongoose"

import { Assignment, Course, Quiz } from "@/lib/models"
import {
  ApiError,
  handleErrors,
  hasRole,
  json,
  parseBody,
  requireRole,
} from "@/lib/api/helpers"
import { lessonBodySchema } from "@/lib/lessons/schemas"
import { applyLessonBody } from "@/lib/lessons/persist"
import { normaliseLesson } from "@/lib/lessons/normalise"

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

    // Points and due dates live on the linked records, and the manager lists
    // them per lesson — fetched in two queries rather than one per lesson.
    const lessonRows = courses.flatMap((c) =>
      (c.modules ?? []).flatMap((m) =>
        (m.lessons ?? []).map((l) => ({ course: c, module: m, lesson: normaliseLesson(l) })),
      ),
    )

    const isId = (value: string | undefined): value is string => Boolean(value)
    const quizIds = lessonRows.map((r) => r.lesson.quiz?.quizId).filter(isId)
    const assignmentIds = lessonRows.map((r) => r.lesson.assignment?.assignmentId).filter(isId)

    const [quizzes, assignments] = await Promise.all([
      Quiz.find({ _id: { $in: quizIds } }).select("questions status").lean(),
      Assignment.find({ _id: { $in: assignmentIds } }).select("points dueDate status").lean(),
    ])

    const quizById = new Map(quizzes.map((q) => [String(q._id), q]))
    const assignmentById = new Map(assignments.map((a) => [String(a._id), a]))

    const lessons = lessonRows.map(({ course, module, lesson }) => {
      const quiz = lesson.quiz?.quizId ? quizById.get(lesson.quiz.quizId) : undefined
      const assignment = lesson.assignment?.assignmentId
        ? assignmentById.get(lesson.assignment.assignmentId)
        : undefined

      return {
        lessonId: lesson._id,
        title: lesson.title,
        type: lesson.type,
        status: lesson.status,
        duration: lesson.duration ?? null,
        order: lesson.order,
        courseId: String(course._id),
        courseCode: course.code,
        courseTitle: course.title,
        moduleId: String(module._id),
        moduleTitle: module.title,
        points: assignment?.points ?? null,
        dueDate: assignment?.dueDate ?? null,
        questionCount: quiz?.questions.length ?? null,
      }
    })

    return json({ lessons, courseCount: courses.length })
  } catch (err) {
    return handleErrors(err)
  }
}

/** Where the lesson goes. The rest of the body is the type-specific schema. */
const placementSchema = z.object({
  courseId: z.string(),
  /** Append to this module; omit to create a new one named `moduleTitle`. */
  moduleId: z.string().optional(),
  moduleTitle: z.string().optional(),
})

const createSchema = z.intersection(placementSchema, lessonBodySchema)

/**
 * POST /api/lessons — add a lesson to a course module.
 *
 * Owning teacher or admin only. The body is validated against the schema for
 * its `type`, which both requires that type's fields and discards any belonging
 * to another — so a payload can't smuggle video settings onto a reading lesson.
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

    const lessonId = new Types.ObjectId()
    const nextOrder = mod.lessons.reduce((max, l) => Math.max(max, l.order ?? 0), -1) + 1

    mod.lessons.push({ _id: lessonId, order: nextOrder, materials: [] } as never)
    const lesson = mod.lessons[mod.lessons.length - 1]

    await applyLessonBody(lesson, body, { course, authorId: me.id, lessonId })
    lesson.order = nextOrder

    await course.save()

    return json(
      {
        lessonId: String(lessonId),
        title: lesson.title,
        type: lesson.type,
        courseId: String(course._id),
        moduleId: String(mod._id),
        quizId: lesson.quiz?.quizId ? String(lesson.quiz.quizId) : undefined,
        assignmentId: lesson.assignment?.assignmentId
          ? String(lesson.assignment.assignmentId)
          : undefined,
      },
      201,
    )
  } catch (err) {
    return handleErrors(err)
  }
}
