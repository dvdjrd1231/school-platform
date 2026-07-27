/**
 * Report whether any of the seeder's demo records are present in the database
 * this process is pointed at, and offer to remove them.
 *
 *   pnpm check-demo-data            # report only, changes nothing
 *   pnpm check-demo-data --remove   # delete the demo accounts and their data
 *
 * The seeder is for scratch databases, but if it was ever run against a real
 * one the fictional students would sit alongside genuine records looking
 * entirely plausible. This finds them by their exact seeded email addresses, so
 * it can never match a real account that merely has a similar name.
 */

import "dotenv/config"
import mongoose from "mongoose"

import { connectDB } from "../lib/db/connect"
import {
  Assignment,
  Conversation,
  Course,
  Enrollment,
  Message,
  Notification,
  SkillAssessment,
  Submission,
  User,
} from "../lib/models"

/**
 * The addresses lib/db/seed.ts creates. Matching on these exact strings is the
 * point: a real "Sarah Johnson" who signed up herself has a different email and
 * is left alone.
 */
const SEEDED_EMAILS = [
  "admin@maatk12.edu",
  "sarah.johnson@maatk12.edu",
  "robert.brown@maatk12.edu",
  "lisa.davis@maatk12.edu",
  "mark.wilson@maatk12.edu",
  "john.smith@maatk12.edu",
  "emily.wilson@maatk12.edu",
  "alex.chen@maatk12.edu",
  "maria.rodriguez@maatk12.edu",
  "parent@maatk12.edu",
]

/**
 * The seeder's admin is `admin@maatk12.edu`, which is also the default
 * ADMIN_USER. If a deployment kept that default then the account is a real
 * administrator — the one being used to run the school — and deleting it would
 * take out the operator's own login along with any courses they own.
 *
 * So whatever ADMIN_USER points at is never treated as demo data.
 */
function removableEmails(): string[] {
  const envAdmin = (process.env.ADMIN_USER ?? "").trim().toLowerCase()
  return SEEDED_EMAILS.filter((email) => email !== envAdmin)
}

async function main() {
  const remove = process.argv.includes("--remove")

  await connectDB()
  const dbName = mongoose.connection.name
  console.log(`Database: ${dbName}\n`)

  const candidates = removableEmails()
  const protectedAdmin = SEEDED_EMAILS.find((e) => !candidates.includes(e))

  const demoUsers = await User.find({ email: { $in: candidates } })
    .select("_id name email roles")
    .lean()

  const totalUsers = await User.countDocuments()

  if (protectedAdmin) {
    console.log(
      `Note: ${protectedAdmin} is your ADMIN_USER, so it is treated as a real account ` +
        `and will not be touched.\n`,
    )
  }

  if (demoUsers.length === 0) {
    console.log(`No seeded demo accounts found. ${totalUsers} real user(s) in the database.`)
    await mongoose.disconnect()
    return
  }

  console.log(`Found ${demoUsers.length} seeded demo account(s) out of ${totalUsers} total:\n`)
  for (const user of demoUsers) {
    console.log(`  ${user.email.padEnd(34)} ${user.roles.join(", ")}  (${user.name})`)
  }

  const ids = demoUsers.map((u) => u._id)
  const demoCourses = await Course.find({ instructor: { $in: ids } }).select("_id title").lean()
  const courseIds = demoCourses.map((c) => c._id)

  console.log(`\nAttached to them: ${demoCourses.length} course(s)`)
  for (const course of demoCourses) console.log(`  ${course.title}`)

  if (!remove) {
    console.log(
      "\nReport only — nothing changed. Re-run with --remove to delete these accounts " +
        "and everything attached to them.",
    )
    await mongoose.disconnect()
    return
  }

  // Order matters: dependent records first, so nothing is left pointing at a
  // user or course that no longer exists.
  const assignments = await Assignment.find({ course: { $in: courseIds } }).select("_id").lean()
  const assignmentIds = assignments.map((a) => a._id)

  const results = {
    submissions: (await Submission.deleteMany({
      $or: [{ student: { $in: ids } }, { assignment: { $in: assignmentIds } }],
    })).deletedCount,
    assignments: (await Assignment.deleteMany({ course: { $in: courseIds } })).deletedCount,
    enrollments: (await Enrollment.deleteMany({
      $or: [{ student: { $in: ids } }, { course: { $in: courseIds } }],
    })).deletedCount,
    skillAssessments: (await SkillAssessment.deleteMany({ student: { $in: ids } })).deletedCount,
    notifications: (await Notification.deleteMany({ user: { $in: ids } })).deletedCount,
    messages: (await Message.deleteMany({ sender: { $in: ids } })).deletedCount,
    conversations: (await Conversation.deleteMany({ participants: { $in: ids } })).deletedCount,
    courses: (await Course.deleteMany({ _id: { $in: courseIds } })).deletedCount,
    users: (await User.deleteMany({ _id: { $in: ids } })).deletedCount,
  }

  console.log("\nRemoved:")
  for (const [label, count] of Object.entries(results)) {
    console.log(`  ${String(count).padStart(4)}  ${label}`)
  }

  console.log(`\n${await User.countDocuments()} user(s) remain.`)
  await mongoose.disconnect()
}

main().catch(async (err) => {
  console.error(err)
  await mongoose.disconnect()
  process.exit(1)
})
