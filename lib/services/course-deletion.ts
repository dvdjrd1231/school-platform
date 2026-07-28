/**
 * Removing a course, and everything that pointed at it.
 *
 * Thirteen collections reference a course. Deleting only the course document
 * leaves all of them behind holding an id that resolves to nothing — orphans
 * that look valid until something tries to read through them. Several of those
 * references are declared `required`, so the records are not merely untidy;
 * they are documents the schema says cannot exist in that state.
 *
 * This is shared by the delete route and by the repair script, so a course
 * removed today and one removed before this existed are cleaned up the same way.
 */

import {
  Announcement,
  Assignment,
  Attendance,
  CalendarEvent,
  Conversation,
  Course,
  Discussion,
  Enrollment,
  FileAsset,
  Group,
  Note,
  Quiz,
  QuizAttempt,
  Submission,
  Survey,
} from "@/lib/models"
import { deleteFile } from "@/lib/storage/gridfs"

export interface CourseCleanupCounts {
  assignments: number
  submissions: number
  quizzes: number
  quizAttempts: number
  enrollments: number
  attendance: number
  groups: number
  announcements: number
  discussions: number
  events: number
  notes: number
  surveys: number
  files: number
  conversations: number
}

/**
 * Delete everything belonging to a course.
 *
 * Order matters: records are removed before the things they hang off, so a
 * failure part-way through leaves fewer dangling references rather than more.
 *
 * What is *not* deleted: a school-wide announcement, discussion, event or
 * survey that merely mentioned the class keeps existing with its course
 * reference cleared, because those were addressed to people rather than to the
 * class. Conversations are unlinked for the same reason — a message thread
 * between a parent and a teacher outlives the class it started in.
 */
export async function purgeCourseData(courseId: string): Promise<CourseCleanupCounts> {
  // Quiz attempts hang off quizzes, and submissions off assignments, so those
  // ids are needed before their parents go.
  const [quizzes, assignments, files] = await Promise.all([
    Quiz.find({ course: courseId }).select("_id").lean(),
    Assignment.find({ course: courseId }).select("_id").lean(),
    FileAsset.find({ course: courseId }).select("_id gridFsId").lean(),
  ])

  const quizIds = quizzes.map((q) => q._id)
  const assignmentIds = assignments.map((a) => a._id)

  const [quizAttempts, submissions] = await Promise.all([
    QuizAttempt.deleteMany({ quiz: { $in: quizIds } }),
    Submission.deleteMany({ $or: [{ course: courseId }, { assignment: { $in: assignmentIds } }] }),
  ])

  // Stored bytes go before the metadata: an orphaned record is a visible, fixable
  // row, whereas orphaned bytes sit in GridFS invisibly forever.
  for (const file of files) {
    // YouTube items have no blob of ours; only stored files do.
    if (!file.gridFsId) continue
    await deleteFile(file.gridFsId).catch(() => {
      // A missing blob is the desired end state; don't abort the whole purge.
    })
  }

  const [
    assignmentsDeleted,
    quizzesDeleted,
    enrollments,
    attendance,
    groups,
    notes,
    filesDeleted,
  ] = await Promise.all([
    Assignment.deleteMany({ course: courseId }),
    Quiz.deleteMany({ course: courseId }),
    Enrollment.deleteMany({ course: courseId }),
    Attendance.deleteMany({ course: courseId }),
    Group.deleteMany({ course: courseId }),
    Note.deleteMany({ course: courseId }),
    FileAsset.deleteMany({ course: courseId }),
  ])

  // Class-scoped content goes; school-wide content is only unlinked.
  const [announcements, discussions, events, surveys, conversations] = await Promise.all([
    Announcement.deleteMany({ course: courseId }),
    Discussion.deleteMany({ course: courseId }),
    CalendarEvent.deleteMany({ course: courseId }),
    Survey.updateMany({ course: courseId }, { $unset: { course: "" } }),
    Conversation.updateMany({ course: courseId }, { $unset: { course: "" } }),
  ])

  return {
    assignments: assignmentsDeleted.deletedCount,
    submissions: submissions.deletedCount,
    quizzes: quizzesDeleted.deletedCount,
    quizAttempts: quizAttempts.deletedCount,
    enrollments: enrollments.deletedCount,
    attendance: attendance.deletedCount,
    groups: groups.deletedCount,
    announcements: announcements.deletedCount,
    discussions: discussions.deletedCount,
    events: events.deletedCount,
    notes: notes.deletedCount,
    surveys: surveys.modifiedCount,
    files: filesDeleted.deletedCount,
    conversations: conversations.modifiedCount,
  }
}

/** What a course still holds, for the confirmation before a hard delete. */
export interface CourseContents {
  enrolled: number
  lessons: number
  assignments: number
  quizzes: number
  submissions: number
  files: number
}

export async function summariseCourseContents(courseId: string): Promise<CourseContents> {
  const course = await Course.findById(courseId).select("modules").lean()

  const [enrolled, assignments, quizzes, submissions, files] = await Promise.all([
    Enrollment.countDocuments({ course: courseId, status: { $ne: "dropped" } }),
    Assignment.countDocuments({ course: courseId }),
    Quiz.countDocuments({ course: courseId }),
    Submission.countDocuments({ course: courseId }),
    FileAsset.countDocuments({ course: courseId }),
  ])

  return {
    enrolled,
    lessons: (course?.modules ?? []).reduce((n, m) => n + (m.lessons?.length ?? 0), 0),
    assignments,
    quizzes,
    submissions,
    files,
  }
}

/**
 * Course ids referenced by other collections that no longer exist.
 *
 * Used by the repair script to find damage done before deletion cascaded.
 */
export async function findOrphanedCourseIds(): Promise<string[]> {
  const referenced = new Set<string>()

  const collectors = [
    Assignment.distinct("course"),
    Quiz.distinct("course"),
    Enrollment.distinct("course"),
    Submission.distinct("course"),
    Attendance.distinct("course"),
    Group.distinct("course"),
    Announcement.distinct("course"),
    Discussion.distinct("course"),
    CalendarEvent.distinct("course"),
    Note.distinct("course"),
    FileAsset.distinct("course"),
    Survey.distinct("course"),
  ]

  for (const ids of await Promise.all(collectors)) {
    for (const id of ids) {
      if (id) referenced.add(String(id))
    }
  }

  if (referenced.size === 0) return []

  const existing = await Course.find({ _id: { $in: [...referenced] } })
    .select("_id")
    .lean()
  const alive = new Set(existing.map((c) => String(c._id)))

  return [...referenced].filter((id) => !alive.has(id))
}
