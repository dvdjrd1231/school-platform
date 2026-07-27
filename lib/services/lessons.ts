/**
 * Lessons live embedded in Course.modules[].lessons, so "find a lesson" means
 * scanning a course's module tree. These helpers keep that traversal in one
 * place instead of repeating it in every route that touches a lesson.
 */

import type { HydratedDocument } from "mongoose"

import { Course, type ICourse, type ILessonItem, type IModule } from "@/lib/models"

export interface LessonLocation {
  course: HydratedDocument<ICourse>
  module: IModule
  lesson: ILessonItem
  /** Index of the lesson within the flattened, ordered lesson list of the course. */
  index: number
}

/** Every lesson of a course in the order a student walks through them. */
export function orderedLessons(course: Pick<ICourse, "modules">): {
  module: IModule
  lesson: ILessonItem
}[] {
  return [...course.modules]
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .flatMap((module) =>
      [...(module.lessons ?? [])]
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((lesson) => ({ module, lesson })),
    )
}

/** Locate a lesson by its id across all courses. Null when it doesn't exist. */
export async function findLesson(lessonId: string): Promise<LessonLocation | null> {
  const course = await Course.findOne({ "modules.lessons._id": lessonId })
  if (!course) return null

  const flat = orderedLessons(course)
  const index = flat.findIndex((entry) => String(entry.lesson._id) === lessonId)
  if (index === -1) return null

  return { course, module: flat[index].module, lesson: flat[index].lesson, index }
}

/**
 * Sequential unlock: a lesson is available when it's the first one, or when
 * every lesson before it has been completed. This is what makes "complete a
 * lesson to unlock the next" work.
 */
export function isUnlocked(
  flat: { lesson: ILessonItem }[],
  index: number,
  completed: Set<string>,
): boolean {
  if (index <= 0) return true
  return flat.slice(0, index).every((entry) => completed.has(String(entry.lesson._id)))
}

/** Progress as a whole percentage of the course's lessons. */
export function progressPercent(total: number, completedCount: number): number {
  if (total === 0) return 0
  return Math.round((completedCount / total) * 100)
}
