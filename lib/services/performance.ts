import { Assignment, Course, Enrollment, Submission } from "@/lib/models"
import {
  calculateCourseGrade,
  calculateGPA,
  calculateTrend,
  toLetterGrade,
  type AssignmentCategory,
  type ScoredItem,
} from "./grading"

export interface CoursePerformance {
  courseId: string
  courseTitle: string
  courseCode: string
  subject: string
  percent: number | null
  letter: string | null
  gradedCount: number
  pendingCount: number
  missingCount: number
}

export interface PerformanceReport {
  studentId: string
  generatedAt: Date
  overall: {
    percent: number | null
    letter: string | null
    gpa: number | null
    trend: { direction: "improving" | "declining" | "steady"; changePercent: number }
  }
  courses: CoursePerformance[]
  /** Chronological graded results, for trend charts. */
  timeline: { date: Date; percent: number; assignment: string; course: string }[]
  categoryBreakdown: { category: AssignmentCategory; percent: number; count: number }[]
  attendanceProxy: { onTime: number; late: number; missing: number }
}

/**
 * Build a full performance report for one student.
 *
 * Reads submissions once and derives every metric from that set, rather than
 * issuing a query per course.
 */
export async function buildPerformanceReport(studentId: string): Promise<PerformanceReport> {
  const enrollments = await Enrollment.find({
    student: studentId,
    status: { $in: ["active", "completed"] },
  })
    .populate("course", "title code subject")
    .lean()

  const courseIds = enrollments.map((e) => e.course?._id ?? e.course)

  const [submissions, assignments] = await Promise.all([
    Submission.find({ student: studentId, course: { $in: courseIds } })
      .populate("assignment", "title points category dueDate")
      .lean(),
    Assignment.find({ course: { $in: courseIds }, status: "published" })
      .select("_id course points category dueDate title")
      .lean(),
  ])

  const submissionByAssignment = new Map(submissions.map((s) => [String(s.assignment?._id), s]))

  const courses: CoursePerformance[] = []
  const allScored: ScoredItem[] = []
  const timeline: PerformanceReport["timeline"] = []
  const categoryTotals = new Map<AssignmentCategory, { earned: number; possible: number; count: number }>()
  let onTime = 0
  let late = 0
  let missing = 0

  const now = new Date()

  for (const enrollment of enrollments) {
    const course = enrollment.course as unknown as {
      _id: unknown
      title: string
      code: string
      subject: string
    }
    if (!course?._id) continue

    const courseAssignments = assignments.filter((a) => String(a.course) === String(course._id))
    const scored: ScoredItem[] = []
    let gradedCount = 0
    let pendingCount = 0
    let missingCount = 0

    for (const assignment of courseAssignments) {
      const sub = submissionByAssignment.get(String(assignment._id))
      const isGraded = sub?.score !== undefined && sub?.score !== null

      if (isGraded) {
        gradedCount++
        const item: ScoredItem = {
          category: (assignment.category ?? "homework") as AssignmentCategory,
          score: sub!.score!,
          points: assignment.points,
        }
        scored.push(item)
        allScored.push(item)

        if (assignment.points > 0) {
          timeline.push({
            date: sub!.gradedAt ?? sub!.submittedAt ?? new Date(),
            percent: Math.round((sub!.score! / assignment.points) * 10000) / 100,
            assignment: assignment.title,
            course: course.title,
          })
        }

        const cat = item.category
        const acc = categoryTotals.get(cat) ?? { earned: 0, possible: 0, count: 0 }
        acc.earned += item.score
        acc.possible += item.points
        acc.count++
        categoryTotals.set(cat, acc)

        if (sub!.isLate) late++
        else onTime++
      } else if (sub && sub.status === "submitted") {
        pendingCount++
      } else if (new Date(assignment.dueDate) < now) {
        // Past due with nothing submitted.
        missingCount++
        missing++
      } else {
        pendingCount++
      }
    }

    const percent = calculateCourseGrade(scored)
    courses.push({
      courseId: String(course._id),
      courseTitle: course.title,
      courseCode: course.code,
      subject: course.subject,
      percent,
      letter: percent === null ? null : toLetterGrade(percent),
      gradedCount,
      pendingCount,
      missingCount,
    })
  }

  const overallPercent = calculateCourseGrade(allScored)
  const gpa = calculateGPA(
    courses.filter((c) => c.percent !== null).map((c) => ({ percent: c.percent! })),
  )

  timeline.sort((a, b) => a.date.getTime() - b.date.getTime())

  return {
    studentId,
    generatedAt: new Date(),
    overall: {
      percent: overallPercent,
      letter: overallPercent === null ? null : toLetterGrade(overallPercent),
      gpa,
      trend: calculateTrend(timeline.map((t) => ({ date: t.date, percent: t.percent }))),
    },
    courses,
    timeline,
    categoryBreakdown: [...categoryTotals.entries()].map(([category, v]) => ({
      category,
      percent: v.possible > 0 ? Math.round((v.earned / v.possible) * 10000) / 100 : 0,
      count: v.count,
    })),
    attendanceProxy: { onTime, late, missing },
  }
}

/** Escape a value for CSV: quote it and double any embedded quotes. */
function csvCell(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value)
  return `"${s.replace(/"/g, '""')}"`
}

/** Render a report as CSV for the export feature. */
export function reportToCSV(report: PerformanceReport, studentName: string): string {
  const lines: string[] = []

  lines.push("Performance Report")
  lines.push(`Student,${csvCell(studentName)}`)
  lines.push(`Generated,${csvCell(report.generatedAt.toISOString())}`)
  lines.push(`Overall,${csvCell(report.overall.percent ?? "N/A")}`)
  lines.push(`Letter,${csvCell(report.overall.letter ?? "N/A")}`)
  lines.push(`GPA,${csvCell(report.overall.gpa ?? "N/A")}`)
  lines.push(`Trend,${csvCell(report.overall.trend.direction)}`)
  lines.push("")

  lines.push("Course,Code,Subject,Percent,Letter,Graded,Pending,Missing")
  for (const c of report.courses) {
    lines.push(
      [
        csvCell(c.courseTitle),
        csvCell(c.courseCode),
        csvCell(c.subject),
        csvCell(c.percent ?? "N/A"),
        csvCell(c.letter ?? "N/A"),
        csvCell(c.gradedCount),
        csvCell(c.pendingCount),
        csvCell(c.missingCount),
      ].join(","),
    )
  }
  lines.push("")

  lines.push("Date,Course,Assignment,Percent")
  for (const t of report.timeline) {
    lines.push(
      [
        csvCell(t.date.toISOString().slice(0, 10)),
        csvCell(t.course),
        csvCell(t.assignment),
        csvCell(t.percent),
      ].join(","),
    )
  }

  return lines.join("\n")
}
