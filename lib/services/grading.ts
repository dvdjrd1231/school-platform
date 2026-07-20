/**
 * Grading and performance calculations.
 *
 * Kept as pure functions with no database access so they can be unit-tested
 * directly and reused by both API routes and dashboard aggregation.
 */

export type AssignmentCategory = "homework" | "quiz" | "exam" | "project" | "participation"

/** Default category weights. Must sum to 1. */
export const DEFAULT_CATEGORY_WEIGHTS: Record<AssignmentCategory, number> = {
  homework: 0.2,
  quiz: 0.15,
  exam: 0.35,
  project: 0.25,
  participation: 0.05,
}

export interface ScoredItem {
  category: AssignmentCategory
  /** Points the student earned. */
  score: number
  /** Points the assignment was out of. */
  points: number
}

/**
 * Reduce a raw score by a late penalty.
 *
 * The penalty is a percentage of the assignment's total points deducted per day
 * late, capped so a student can never receive a negative score.
 */
export function applyLatePenalty(
  rawScore: number,
  totalPoints: number,
  daysLate: number,
  penaltyPercentPerDay: number,
): number {
  if (daysLate <= 0 || penaltyPercentPerDay <= 0) return rawScore
  const deduction = totalPoints * (penaltyPercentPerDay / 100) * daysLate
  return Math.max(0, round2(rawScore - deduction))
}

/** Whole days late, rounded up. Returns 0 when submitted on time. */
export function calculateDaysLate(submittedAt: Date, dueDate: Date): number {
  const ms = submittedAt.getTime() - dueDate.getTime()
  if (ms <= 0) return 0
  return Math.ceil(ms / 86_400_000)
}

/**
 * Weighted course percentage.
 *
 * Categories with no graded work are excluded and the remaining weights are
 * renormalised — otherwise a student would be penalised early in a term for
 * exams that haven't happened yet.
 *
 * Returns null when nothing has been graded, which callers should render as
 * "no grade yet" rather than 0%.
 */
export function calculateCourseGrade(
  items: ScoredItem[],
  weights: Record<AssignmentCategory, number> = DEFAULT_CATEGORY_WEIGHTS,
): number | null {
  if (items.length === 0) return null

  const byCategory = new Map<AssignmentCategory, { earned: number; possible: number }>()
  for (const item of items) {
    // Zero-point assignments (extra credit placeholders, ungraded practice)
    // would make the ratio undefined; skip them.
    if (item.points <= 0) continue
    const acc = byCategory.get(item.category) ?? { earned: 0, possible: 0 }
    acc.earned += item.score
    acc.possible += item.points
    byCategory.set(item.category, acc)
  }

  if (byCategory.size === 0) return null

  let weightedSum = 0
  let totalWeight = 0
  for (const [category, { earned, possible }] of byCategory) {
    const weight = weights[category] ?? 0
    if (weight <= 0 || possible <= 0) continue
    weightedSum += (earned / possible) * weight
    totalWeight += weight
  }

  if (totalWeight === 0) return null
  return round2((weightedSum / totalWeight) * 100)
}

const LETTER_THRESHOLDS: [number, string][] = [
  [97, "A+"], [93, "A"], [90, "A-"],
  [87, "B+"], [83, "B"], [80, "B-"],
  [77, "C+"], [73, "C"], [70, "C-"],
  [67, "D+"], [63, "D"], [60, "D-"],
]

/** Letter grade on a standard US scale. */
export function toLetterGrade(percent: number): string {
  for (const [min, letter] of LETTER_THRESHOLDS) {
    if (percent >= min) return letter
  }
  return "F"
}

const GPA_POINTS: Record<string, number> = {
  "A+": 4.0, A: 4.0, "A-": 3.7,
  "B+": 3.3, B: 3.0, "B-": 2.7,
  "C+": 2.3, C: 2.0, "C-": 1.7,
  "D+": 1.3, D: 1.0, "D-": 0.7,
  F: 0.0,
}

/** 4.0-scale GPA points for a percentage grade. */
export function toGradePoints(percent: number): number {
  return GPA_POINTS[toLetterGrade(percent)] ?? 0
}

/**
 * Unweighted GPA across courses. Each course counts equally; pass credits to
 * weight by course load.
 */
export function calculateGPA(courses: { percent: number; credits?: number }[]): number | null {
  if (courses.length === 0) return null
  let points = 0
  let credits = 0
  for (const c of courses) {
    const credit = c.credits ?? 1
    if (credit <= 0) continue
    points += toGradePoints(c.percent) * credit
    credits += credit
  }
  if (credits === 0) return null
  return round2(points / credits)
}

export interface TrendPoint {
  date: Date
  percent: number
}

/**
 * Trend direction over a series of graded results.
 *
 * Compares the mean of the first half against the mean of the second half,
 * which is more stable against a single outlier than first-vs-last.
 */
export function calculateTrend(points: TrendPoint[]): {
  direction: "improving" | "declining" | "steady"
  changePercent: number
} {
  if (points.length < 2) return { direction: "steady", changePercent: 0 }

  const sorted = [...points].sort((a, b) => a.date.getTime() - b.date.getTime())
  const mid = Math.floor(sorted.length / 2)
  const firstHalf = sorted.slice(0, mid)
  const secondHalf = sorted.slice(mid)

  const mean = (arr: TrendPoint[]) => arr.reduce((s, p) => s + p.percent, 0) / arr.length
  const change = round2(mean(secondHalf) - mean(firstHalf))

  // A swing under 2 points is noise, not a trend.
  if (Math.abs(change) < 2) return { direction: "steady", changePercent: change }
  return { direction: change > 0 ? "improving" : "declining", changePercent: change }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
