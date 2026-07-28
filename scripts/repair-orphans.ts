/**
 * Find and clean up records left behind by a course that was deleted before
 * deletion cascaded.
 *
 *   pnpm repair-orphans            # report only, changes nothing
 *   pnpm repair-orphans --fix      # remove the orphaned records
 *
 * Deleting a course used to remove only the course document. Assignments,
 * submissions, quizzes, enrolments, attendance, groups, files and more were
 * left holding a course id that resolves to nothing. Most screens tolerate
 * that, but any that reads through the reference without a guard fails, and a
 * failure during render takes the page with it.
 *
 * Run the report first. Take a backup before running --fix.
 */

import "dotenv/config"
import mongoose from "mongoose"

import { connectDB } from "../lib/db/connect"
import {
  Announcement,
  Assignment,
  Attendance,
  CalendarEvent,
  Course,
  Discussion,
  Enrollment,
  FileAsset,
  Group,
  Note,
  Quiz,
  Submission,
  Survey,
} from "../lib/models"
import { findOrphanedCourseIds, purgeCourseData } from "../lib/services/course-deletion"

/** Count what each collection still holds for a missing course. */
async function countFor(courseId: string) {
  const [
    assignments,
    quizzes,
    enrollments,
    submissions,
    attendance,
    groups,
    announcements,
    discussions,
    events,
    notes,
    files,
    surveys,
  ] = await Promise.all([
    Assignment.countDocuments({ course: courseId }),
    Quiz.countDocuments({ course: courseId }),
    Enrollment.countDocuments({ course: courseId }),
    Submission.countDocuments({ course: courseId }),
    Attendance.countDocuments({ course: courseId }),
    Group.countDocuments({ course: courseId }),
    Announcement.countDocuments({ course: courseId }),
    Discussion.countDocuments({ course: courseId }),
    CalendarEvent.countDocuments({ course: courseId }),
    Note.countDocuments({ course: courseId }),
    FileAsset.countDocuments({ course: courseId }),
    Survey.countDocuments({ course: courseId }),
  ])

  return {
    assignments,
    quizzes,
    enrollments,
    submissions,
    attendance,
    groups,
    announcements,
    discussions,
    events,
    notes,
    files,
    surveys,
  }
}

async function main() {
  const fix = process.argv.includes("--fix")

  await connectDB()
  console.log(`Database: ${mongoose.connection.name}`)
  console.log(`Courses currently in the database: ${await Course.countDocuments()}\n`)

  const orphanIds = await findOrphanedCourseIds()

  if (orphanIds.length === 0) {
    console.log("No orphaned records found — every course reference resolves to a real course.")
    await mongoose.disconnect()
    return
  }

  console.log(`Found ${orphanIds.length} deleted course(s) still referenced:\n`)

  let grandTotal = 0
  for (const id of orphanIds) {
    const counts = await countFor(id)
    const total = Object.values(counts).reduce((sum, n) => sum + n, 0)
    grandTotal += total

    console.log(`  Course ${id} — ${total} leftover record(s)`)
    for (const [label, count] of Object.entries(counts)) {
      if (count > 0) console.log(`      ${String(count).padStart(5)}  ${label}`)
    }
  }

  if (!fix) {
    console.log(
      `\n${grandTotal} record(s) in total. Report only — nothing changed.\n` +
        "Re-run with --fix to remove them. Take a backup first.",
    )
    await mongoose.disconnect()
    return
  }

  console.log("\nCleaning up…\n")
  for (const id of orphanIds) {
    const removed = await purgeCourseData(id)
    const total = Object.values(removed).reduce((sum, n) => sum + n, 0)
    console.log(`  Course ${id}: ${total} record(s) removed`)
  }

  const remaining = await findOrphanedCourseIds()
  console.log(
    remaining.length === 0
      ? "\nDone — no orphaned course references remain."
      : `\nWarning: ${remaining.length} course id(s) are still referenced. Re-run to see what.`,
  )

  await mongoose.disconnect()
}

main().catch(async (err) => {
  console.error(err)
  await mongoose.disconnect()
  process.exit(1)
})
