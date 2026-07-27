/**
 * Report — and optionally remove — the seeder's demo records, using only
 * mongosh inside the running MongoDB container.
 *
 * The TypeScript equivalent (scripts/check-demo-data.ts) needs the source tree
 * and dev dependencies, which the production image deliberately doesn't carry.
 * This does the same job with what's already on the server.
 *
 * Report only:
 *   docker compose exec -T mongo mongosh \
 *     -u "$MONGO_ROOT_USER" -p "$MONGO_ROOT_PASSWORD" --authenticationDatabase admin \
 *     school-platform --quiet --file /scripts/demo-data.mongo.js
 *
 * Remove (add REMOVE=true and ADMIN_EMAIL so your own admin is spared):
 *   docker compose exec -T -e REMOVE=true -e ADMIN_EMAIL="$ADMIN_USER" mongo mongosh ...
 */

// The accounts lib/db/seed.ts creates. Exact-match only, so a real person with
// a similar name is never caught by this.
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

const remove = (process.env.REMOVE || "").toLowerCase() === "true"
const adminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase()

// The seeder's admin address doubles as the default ADMIN_USER. If this
// deployment kept that default, the account is a real administrator running the
// school — never delete it.
const candidates = SEEDED_EMAILS.filter((email) => email !== adminEmail)
if (adminEmail && SEEDED_EMAILS.includes(adminEmail)) {
  print(`Note: ${adminEmail} is ADMIN_USER — treated as a real account, left alone.\n`)
} else if (!adminEmail) {
  print(
    "Warning: ADMIN_EMAIL was not passed. If your ADMIN_USER is one of the seeded\n" +
      "addresses it would be deleted. Pass -e ADMIN_EMAIL=\"$ADMIN_USER\" to protect it.\n",
  )
}

const users = db.users.find({ email: { $in: candidates } }, { email: 1, name: 1, roles: 1 }).toArray()
const totalUsers = db.users.countDocuments()

if (users.length === 0) {
  print(`No seeded demo accounts found. ${totalUsers} real user(s) in the database.`)
} else {
  print(`Found ${users.length} seeded demo account(s) out of ${totalUsers} total:\n`)
  users.forEach((u) => print(`  ${u.email}  [${(u.roles || []).join(", ")}]  ${u.name}`))

  const ids = users.map((u) => u._id)
  const courseIds = db.courses
    .find({ instructor: { $in: ids } }, { _id: 1 })
    .toArray()
    .map((c) => c._id)

  print(`\nAttached: ${courseIds.length} course(s)`)

  if (!remove) {
    print("\nReport only — nothing changed. Re-run with -e REMOVE=true to delete these.")
  } else {
    const assignmentIds = db.assignments
      .find({ course: { $in: courseIds } }, { _id: 1 })
      .toArray()
      .map((a) => a._id)

    // Dependants first, so nothing is left pointing at a deleted user or course.
    const removed = {
      submissions: db.submissions.deleteMany({
        $or: [{ student: { $in: ids } }, { assignment: { $in: assignmentIds } }],
      }).deletedCount,
      assignments: db.assignments.deleteMany({ course: { $in: courseIds } }).deletedCount,
      enrollments: db.enrollments.deleteMany({
        $or: [{ student: { $in: ids } }, { course: { $in: courseIds } }],
      }).deletedCount,
      skillassessments: db.skillassessments.deleteMany({ student: { $in: ids } }).deletedCount,
      notifications: db.notifications.deleteMany({ user: { $in: ids } }).deletedCount,
      messages: db.messages.deleteMany({ sender: { $in: ids } }).deletedCount,
      conversations: db.conversations.deleteMany({ participants: { $in: ids } }).deletedCount,
      courses: db.courses.deleteMany({ _id: { $in: courseIds } }).deletedCount,
      users: db.users.deleteMany({ _id: { $in: ids } }).deletedCount,
    }

    print("\nRemoved:")
    Object.keys(removed).forEach((k) => print(`  ${String(removed[k]).padStart(4)}  ${k}`))
    print(`\n${db.users.countDocuments()} user(s) remain.`)
  }
}
