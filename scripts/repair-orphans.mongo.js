/**
 * Find and clean up records left behind by a deleted course, using only
 * mongosh inside the running MongoDB container.
 *
 * Deleting a course used to remove only the course document, leaving
 * assignments, submissions, quizzes, enrolments, attendance, groups, files and
 * more holding a course id that resolves to nothing. Any screen that reads
 * through such a reference without a guard fails, and a failure during render
 * takes the whole page down.
 *
 * Report only:
 *   docker compose exec -T mongo mongosh \
 *     -u "$MONGO_ROOT_USER" -p "$MONGO_ROOT_PASSWORD" --authenticationDatabase admin \
 *     school-platform --quiet --file /scripts/repair-orphans.mongo.js
 *
 * Clean up (take a backup first):
 *   docker compose exec -T -e FIX=true mongo mongosh ... --file /scripts/repair-orphans.mongo.js
 */

const fix = (process.env.FIX || "").toLowerCase() === "true"

// Collections holding a `course` reference, and whether a leftover record
// should be deleted or merely unlinked. School-wide surveys and parent–teacher
// conversations outlive the class they were attached to, so those are unlinked.
const OWNED = [
  "assignments",
  "quizzes",
  "enrollments",
  "submissions",
  "attendances",
  "groups",
  "announcements",
  "discussions",
  "calendarevents",
  "notes",
  "fileassets",
]
const UNLINK = ["surveys", "conversations"]

const liveCourseIds = new Set(
  db.courses
    .find({}, { _id: 1 })
    .toArray()
    .map((c) => String(c._id)),
)

print(`Database: ${db.getName()}`)
print(`Courses currently in the database: ${liveCourseIds.size}\n`)

// Gather every course id referenced anywhere, then keep the ones with no course.
const referenced = new Set()
for (const name of OWNED.concat(UNLINK)) {
  for (const id of db.getCollection(name).distinct("course")) {
    if (id) referenced.add(String(id))
  }
}

const orphanIds = [...referenced].filter((id) => !liveCourseIds.has(id))

if (orphanIds.length === 0) {
  print("No orphaned records found — every course reference resolves to a real course.")
} else {
  print(`Found ${orphanIds.length} deleted course(s) still referenced:\n`)

  let grandTotal = 0
  const perCourse = {}

  for (const id of orphanIds) {
    const courseId = ObjectId(id)
    const counts = {}
    let total = 0

    for (const name of OWNED.concat(UNLINK)) {
      const n = db.getCollection(name).countDocuments({ course: courseId })
      if (n > 0) {
        counts[name] = n
        total += n
      }
    }

    perCourse[id] = counts
    grandTotal += total

    print(`  Course ${id} — ${total} leftover record(s)`)
    Object.keys(counts).forEach((name) =>
      print(`      ${String(counts[name]).padStart(5)}  ${name}`),
    )
  }

  if (!fix) {
    print(
      `\n${grandTotal} record(s) in total. Report only — nothing changed.\n` +
        "Re-run with -e FIX=true to remove them. Take a backup first.",
    )
  } else {
    print("\nCleaning up…\n")

    for (const id of orphanIds) {
      const courseId = ObjectId(id)

      // Quiz attempts and submissions hang off quizzes and assignments, so
      // collect those ids before their parents are removed.
      const quizIds = db.quizzes
        .find({ course: courseId }, { _id: 1 })
        .toArray()
        .map((q) => q._id)
      const assignmentIds = db.assignments
        .find({ course: courseId }, { _id: 1 })
        .toArray()
        .map((a) => a._id)

      let removed = 0
      if (quizIds.length > 0) {
        removed += db.quizattempts.deleteMany({ quiz: { $in: quizIds } }).deletedCount
      }
      if (assignmentIds.length > 0) {
        removed += db.submissions.deleteMany({ assignment: { $in: assignmentIds } }).deletedCount
      }

      // GridFS blobs for this class's files, before the metadata that names them.
      const files = db.fileassets.find({ course: courseId }, { gridFsId: 1 }).toArray()
      for (const file of files) {
        if (!file.gridFsId) continue
        db.getCollection("uploads.chunks").deleteMany({ files_id: file.gridFsId })
        db.getCollection("uploads.files").deleteMany({ _id: file.gridFsId })
      }

      for (const name of OWNED) {
        removed += db.getCollection(name).deleteMany({ course: courseId }).deletedCount
      }
      for (const name of UNLINK) {
        removed += db
          .getCollection(name)
          .updateMany({ course: courseId }, { $unset: { course: "" } }).modifiedCount
      }

      print(`  Course ${id}: ${removed} record(s) cleaned`)
    }

    // Confirm.
    const stillReferenced = new Set()
    for (const name of OWNED.concat(UNLINK)) {
      for (const id of db.getCollection(name).distinct("course")) {
        if (id && !liveCourseIds.has(String(id))) stillReferenced.add(String(id))
      }
    }

    print(
      stillReferenced.size === 0
        ? "\nDone — no orphaned course references remain."
        : `\nWarning: ${stillReferenced.size} course id(s) are still referenced. Re-run to see what.`,
    )
  }
}
