/**
 * Seed the database with a working dataset derived from the original mock data.
 *
 *   pnpm seed          # insert if empty
 *   pnpm seed --reset  # wipe the seeded collections first
 *
 * Every account is created with a known password so the app is usable
 * immediately after seeding. Change them before any real deployment.
 */
import "dotenv/config"
import mongoose from "mongoose"

import { connectDB, disconnectDB } from "../lib/db/connect"
import {
  Assignment,
  Conversation,
  Course,
  Enrollment,
  Message,
  Notification,
  Submission,
  User,
  hashPassword,
} from "../lib/models"

const DEFAULT_PASSWORD = "Password123!"

async function seed() {
  const reset = process.argv.includes("--reset")
  await connectDB()
  console.log("Connected to MongoDB")

  if (reset) {
    console.log("Resetting collections…")
    await Promise.all([
      User.deleteMany({}),
      Course.deleteMany({}),
      Enrollment.deleteMany({}),
      Assignment.deleteMany({}),
      Submission.deleteMany({}),
      Conversation.deleteMany({}),
      Message.deleteMany({}),
      Notification.deleteMany({}),
    ])
  }

  const existing = await User.countDocuments()
  if (existing > 0 && !reset) {
    console.log(`Database already has ${existing} users. Use --reset to wipe and reseed.`)
    await disconnectDB()
    return
  }

  const passwordHash = await hashPassword(DEFAULT_PASSWORD)

  // ---- Users -------------------------------------------------------------
  const [admin, teacherMath, teacherBio, teacherEng, teacherHist] = await User.create([
    { name: "Mike Davis", email: "admin@maatk12.edu", passwordHash, roles: ["admin"], department: "IT" },
    { name: "Sarah Johnson", email: "sarah.johnson@maatk12.edu", passwordHash, roles: ["teacher"], subject: "Mathematics", officeHours: "MWF 2:00-4:00 PM" },
    { name: "Robert Brown", email: "robert.brown@maatk12.edu", passwordHash, roles: ["teacher"], subject: "Science", officeHours: "TTh 1:00-3:00 PM" },
    { name: "Lisa Davis", email: "lisa.davis@maatk12.edu", passwordHash, roles: ["teacher"], subject: "English" },
    { name: "Mark Wilson", email: "mark.wilson@maatk12.edu", passwordHash, roles: ["teacher"], subject: "History" },
  ])

  const students = await User.create([
    { name: "John Smith", email: "john.smith@maatk12.edu", passwordHash, roles: ["student"], gradeLevel: "10th", studentId: "S-00001", enrollmentDate: new Date("2024-01-15") },
    { name: "Emily Wilson", email: "emily.wilson@maatk12.edu", passwordHash, roles: ["student"], gradeLevel: "11th", studentId: "S-00002", enrollmentDate: new Date("2024-01-15") },
    { name: "Alex Chen", email: "alex.chen@maatk12.edu", passwordHash, roles: ["student"], gradeLevel: "10th", studentId: "S-00003", enrollmentDate: new Date("2024-01-15") },
    { name: "Maria Rodriguez", email: "maria.rodriguez@maatk12.edu", passwordHash, roles: ["student"], gradeLevel: "10th", studentId: "S-00004", enrollmentDate: new Date("2024-01-15") },
  ])

  // A parent linked to two of the students, so the parent portal has data.
  const parent = await User.create({
    name: "Patricia Smith",
    email: "parent@maatk12.edu",
    passwordHash,
    roles: ["parent"],
    children: [students[0]._id, students[2]._id],
  })

  console.log(`Created ${2 + students.length + 4} users`)

  // ---- Courses -----------------------------------------------------------
  const courses = await Course.create([
    {
      code: "MATH-101", title: "Advanced Mathematics", subject: "Mathematics",
      description: "Algebra, geometry, and calculus fundamentals.",
      instructor: teacherMath._id, schedule: "MWF 10:00-11:00", room: "A101",
      status: "active", maxStudents: 30,
      startDate: new Date("2024-01-15"), endDate: new Date("2024-05-15"),
      modules: [
        {
          title: "Algebra Fundamentals", description: "Basics of algebraic thinking",
          order: 1, status: "in-progress",
          lessons: [
            { title: "Variables and Constants", type: "video", duration: "25 min", order: 1, content: "Variables represent unknown values; constants are fixed.", materials: [] },
            { title: "Basic Operations", type: "interactive", duration: "30 min", order: 2, content: "The four operations and PEMDAS.", materials: [] },
            { title: "Solving Simple Equations", type: "video", duration: "35 min", order: 3, content: "Isolation techniques and checking answers.", materials: [] },
          ],
        },
        {
          title: "Geometry Essentials", description: "Shapes, angles, spatial relationships",
          order: 2, status: "available",
          lessons: [
            { title: "Points, Lines, and Planes", type: "video", duration: "30 min", order: 1, content: "The building blocks of geometry.", materials: [] },
            { title: "Angles and Their Properties", type: "interactive", duration: "45 min", order: 2, content: "Acute, obtuse, and right angles.", materials: [] },
          ],
        },
      ],
    },
    {
      code: "BIO-201", title: "Biology Laboratory", subject: "Science",
      description: "Cellular biology, genetics, and molecular processes.",
      instructor: teacherBio._id, schedule: "TTh 2:00-3:30", room: "B205",
      status: "active", maxStudents: 25,
      startDate: new Date("2024-01-15"), endDate: new Date("2024-05-15"),
      modules: [
        {
          title: "Cell Biology Basics", order: 1, status: "in-progress",
          lessons: [
            { title: "Cell Theory", type: "reading", duration: "20 min", order: 1, content: "All living things are made of cells.", materials: [] },
            { title: "Plant vs Animal Cells", type: "video", duration: "40 min", order: 2, content: "Chloroplasts, cell walls, and shared organelles.", materials: [] },
          ],
        },
      ],
    },
    {
      code: "ENG-301", title: "English Literature", subject: "English",
      description: "Classic and contemporary literature with critical analysis.",
      instructor: teacherEng._id, schedule: "MWF 1:00-2:00", room: "C103",
      status: "active", maxStudents: 25,
      startDate: new Date("2024-01-15"), endDate: new Date("2024-05-15"),
      modules: [],
    },
    {
      code: "HIST-401", title: "World History", subject: "History",
      description: "World civilizations and historical events.",
      instructor: teacherHist._id, schedule: "TTh 9:00-10:30", room: "D201",
      status: "upcoming", maxStudents: 30,
      startDate: new Date("2024-02-01"), endDate: new Date("2024-06-01"),
      modules: [],
    },
  ])
  console.log(`Created ${courses.length} courses`)

  // ---- Enrollments -------------------------------------------------------
  const enrollments: { student: mongoose.Types.ObjectId; course: mongoose.Types.ObjectId; status: string }[] = []
  for (const student of students) {
    for (const course of courses.slice(0, 3)) {
      enrollments.push({ student: student._id, course: course._id, status: "active" })
    }
  }
  await Enrollment.insertMany(enrollments)
  console.log(`Created ${enrollments.length} enrollments`)

  // ---- Assignments -------------------------------------------------------
  const [math, bio, eng] = courses
  const assignments = await Assignment.create([
    { title: "Algebra Problem Set #3", description: "Complete problems 1-20 from Chapter 3.", course: math._id, createdBy: teacherMath._id, dueDate: daysFromNow(-10), points: 100, category: "homework", status: "published" },
    { title: "Linear Equations Essay", description: "500 words on real-world applications.", course: math._id, createdBy: teacherMath._id, dueDate: daysFromNow(-3), points: 75, category: "homework", status: "published" },
    { title: "Midterm Exam", description: "Covers chapters 1-4.", course: math._id, createdBy: teacherMath._id, dueDate: daysFromNow(-6), points: 200, category: "exam", status: "published" },
    { title: "Quadratic Functions Project", description: "Presentation with graphs and examples.", course: math._id, createdBy: teacherMath._id, dueDate: daysFromNow(7), points: 150, category: "project", status: "published" },
    { title: "Lab Report #3", description: "Microscope observations write-up.", course: bio._id, createdBy: teacherBio._id, dueDate: daysFromNow(-5), points: 100, category: "homework", status: "published" },
    { title: "Cell Structure Quiz", description: "Organelles and their functions.", course: bio._id, createdBy: teacherBio._id, dueDate: daysFromNow(-2), points: 50, category: "quiz", status: "published" },
    { title: "Essay Analysis", description: "Critical analysis of assigned reading.", course: eng._id, createdBy: teacherEng._id, dueDate: daysFromNow(-8), points: 100, category: "homework", status: "published" },
  ])
  console.log(`Created ${assignments.length} assignments`)

  // ---- Submissions with a spread of grades ------------------------------
  // Deterministic scores so the performance dashboard shows a real trend
  // rather than flat or random data.
  const scorePattern = [0.85, 0.78, 0.92, 0.88, 0.95, 0.72, 0.9]
  const submissions: Record<string, unknown>[] = []

  students.forEach((student, si) => {
    assignments.forEach((assignment, ai) => {
      if (assignment.dueDate > new Date()) return // not yet due

      const ratio = scorePattern[(si + ai) % scorePattern.length]
      const score = Math.round(assignment.points * ratio)
      const isLate = (si + ai) % 5 === 0
      submissions.push({
        assignment: assignment._id,
        student: student._id,
        course: assignment.course,
        content: `Submission for ${assignment.title}`,
        files: [],
        status: "graded",
        submittedAt: new Date(assignment.dueDate.getTime() - (isLate ? -86_400_000 : 3_600_000)),
        isLate,
        daysLate: isLate ? 1 : 0,
        rawScore: score,
        score: isLate ? Math.max(0, score - assignment.points * 0.1) : score,
        feedback: ratio >= 0.9 ? "Excellent work." : "Good effort — review the marked sections.",
        gradedBy: assignment.createdBy,
        gradedAt: new Date(assignment.dueDate.getTime() + 172_800_000),
      })
    })
  })
  await Submission.insertMany(submissions)
  console.log(`Created ${submissions.length} graded submissions`)

  // ---- A parent-teacher conversation ------------------------------------
  const conversation = await Conversation.create({
    participants: [parent._id, teacherMath._id],
    subject: "John's progress in Advanced Mathematics",
    regardingStudent: students[0]._id,
    course: math._id,
    lastMessage: "Thank you for the update — we'll work on it at home.",
    lastMessageAt: new Date(),
    unreadCounts: new Map([
      [parent._id.toString(), 0],
      [teacherMath._id.toString(), 1],
    ]),
  })

  await Message.insertMany([
    { conversation: conversation._id, sender: teacherMath._id, body: "Hello, John is doing well overall but has missed two homework deadlines this month.", readBy: [teacherMath._id, parent._id] },
    { conversation: conversation._id, sender: parent._id, body: "Thank you for the update — we'll work on it at home.", readBy: [parent._id] },
  ])
  console.log("Created 1 parent-teacher conversation")

  console.log("\nSeed complete. Sign in with any of:")
  console.log(`  admin@maatk12.edu          / ${DEFAULT_PASSWORD}  (admin)`)
  console.log(`  sarah.johnson@maatk12.edu  / ${DEFAULT_PASSWORD}  (teacher)`)
  console.log(`  john.smith@maatk12.edu     / ${DEFAULT_PASSWORD}  (student)`)
  console.log(`  parent@maatk12.edu         / ${DEFAULT_PASSWORD}  (parent)`)

  await disconnectDB()
}

function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * 86_400_000)
}

seed().catch((err) => {
  console.error("Seed failed:", err)
  process.exit(1)
})
