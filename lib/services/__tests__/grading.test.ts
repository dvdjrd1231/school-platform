import { describe, expect, it } from "vitest"

import {
  applyLatePenalty,
  calculateCourseGrade,
  calculateDaysLate,
  calculateGPA,
  calculateTrend,
  toGradePoints,
  toLetterGrade,
  type ScoredItem,
} from "../grading"

describe("applyLatePenalty", () => {
  it("leaves an on-time score untouched", () => {
    expect(applyLatePenalty(90, 100, 0, 10)).toBe(90)
  })

  it("deducts a percentage of total points per day late", () => {
    // 2 days x 10% of 100 points = 20 off.
    expect(applyLatePenalty(90, 100, 2, 10)).toBe(70)
  })

  it("never returns a negative score", () => {
    expect(applyLatePenalty(10, 100, 30, 10)).toBe(0)
  })

  it("ignores a zero penalty rate", () => {
    expect(applyLatePenalty(90, 100, 5, 0)).toBe(90)
  })
})

describe("calculateDaysLate", () => {
  const due = new Date("2024-03-10T23:59:00Z")

  it("returns 0 when submitted before the deadline", () => {
    expect(calculateDaysLate(new Date("2024-03-10T10:00:00Z"), due)).toBe(0)
  })

  it("rounds a partial day up to a full day", () => {
    expect(calculateDaysLate(new Date("2024-03-11T02:00:00Z"), due)).toBe(1)
  })

  it("counts multiple days", () => {
    expect(calculateDaysLate(new Date("2024-03-13T12:00:00Z"), due)).toBe(3)
  })
})

describe("calculateCourseGrade", () => {
  it("returns null when nothing is graded", () => {
    expect(calculateCourseGrade([])).toBeNull()
  })

  it("weights categories according to the scheme", () => {
    const items: ScoredItem[] = [
      { category: "homework", score: 100, points: 100 }, // 100%
      { category: "exam", score: 50, points: 100 }, // 50%
    ]
    // Renormalised: homework 0.2, exam 0.35 -> total 0.55
    // (1.0*0.2 + 0.5*0.35) / 0.55 = 0.375/0.55 = 68.18%
    expect(calculateCourseGrade(items)).toBeCloseTo(68.18, 1)
  })

  it("renormalises so ungraded categories don't count against the student", () => {
    // Only homework graded, all correct -> 100%, not 20%.
    expect(calculateCourseGrade([{ category: "homework", score: 100, points: 100 }])).toBe(100)
  })

  it("skips zero-point assignments rather than dividing by zero", () => {
    const result = calculateCourseGrade([
      { category: "homework", score: 0, points: 0 },
      { category: "homework", score: 80, points: 100 },
    ])
    expect(result).toBe(80)
  })

  it("returns null when every item is worth zero points", () => {
    expect(calculateCourseGrade([{ category: "homework", score: 0, points: 0 }])).toBeNull()
  })
})

describe("toLetterGrade", () => {
  it.each([
    [98, "A+"], [95, "A"], [91, "A-"],
    [88, "B+"], [85, "B"], [81, "B-"],
    [78, "C+"], [75, "C"], [70, "C-"], [61, "D-"],
    [45, "F"], [0, "F"],
  ])("maps %i%% to %s", (percent, letter) => {
    expect(toLetterGrade(percent)).toBe(letter)
  })

  it("puts boundary values in the higher band", () => {
    expect(toLetterGrade(90)).toBe("A-")
    expect(toLetterGrade(89.99)).toBe("B+")
  })
})

describe("calculateGPA", () => {
  it("returns null with no courses", () => {
    expect(calculateGPA([])).toBeNull()
  })

  it("averages grade points across courses", () => {
    // A (4.0) and C (2.0) -> 3.0
    expect(calculateGPA([{ percent: 95 }, { percent: 73 }])).toBe(3)
  })

  it("weights by credits when supplied", () => {
    // A(4.0) x 3 credits, F(0) x 1 credit -> 12/4 = 3.0
    expect(calculateGPA([{ percent: 95, credits: 3 }, { percent: 20, credits: 1 }])).toBe(3)
  })

  it("ignores courses with non-positive credits", () => {
    expect(calculateGPA([{ percent: 95, credits: 1 }, { percent: 20, credits: 0 }])).toBe(4)
  })
})

describe("toGradePoints", () => {
  it("maps percentages to the 4.0 scale", () => {
    expect(toGradePoints(95)).toBe(4.0)
    expect(toGradePoints(85)).toBe(3.0)
    expect(toGradePoints(50)).toBe(0)
  })
})

describe("calculateTrend", () => {
  const d = (day: number) => new Date(2024, 2, day)

  it("reports steady with fewer than two points", () => {
    expect(calculateTrend([{ date: d(1), percent: 80 }]).direction).toBe("steady")
  })

  it("detects improvement", () => {
    const result = calculateTrend([
      { date: d(1), percent: 60 },
      { date: d(2), percent: 65 },
      { date: d(3), percent: 85 },
      { date: d(4), percent: 90 },
    ])
    expect(result.direction).toBe("improving")
    expect(result.changePercent).toBeGreaterThan(0)
  })

  it("detects decline", () => {
    const result = calculateTrend([
      { date: d(1), percent: 95 },
      { date: d(2), percent: 90 },
      { date: d(3), percent: 70 },
      { date: d(4), percent: 65 },
    ])
    expect(result.direction).toBe("declining")
    expect(result.changePercent).toBeLessThan(0)
  })

  it("treats a swing under 2 points as noise", () => {
    expect(
      calculateTrend([
        { date: d(1), percent: 80 },
        { date: d(2), percent: 81 },
      ]).direction,
    ).toBe("steady")
  })

  it("sorts unordered input before comparing", () => {
    const result = calculateTrend([
      { date: d(4), percent: 90 },
      { date: d(1), percent: 60 },
      { date: d(3), percent: 85 },
      { date: d(2), percent: 65 },
    ])
    expect(result.direction).toBe("improving")
  })
})
