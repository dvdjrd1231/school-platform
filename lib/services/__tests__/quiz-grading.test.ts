import { describe, expect, it } from "vitest"

import { gradeAnswer, totalAttempt } from "@/lib/services/quiz-grading"
import type { IQuizQuestion } from "@/lib/models/Quiz"

function question(overrides: Partial<IQuizQuestion> = {}): IQuizQuestion {
  return {
    prompt: "What is 3 × 4?",
    type: "multiple-choice",
    options: ["10", "12", "14"],
    correctAnswers: ["12"],
    points: 2,
    order: 0,
    ...overrides,
  }
}

describe("gradeAnswer", () => {
  it("awards full points for the right choice", () => {
    expect(gradeAnswer(question(), ["12"])).toEqual({ earned: 2, correct: true })
  })

  it("scores zero for the wrong choice", () => {
    expect(gradeAnswer(question(), ["10"])).toEqual({ earned: 0, correct: false })
  })

  it("treats a blank answer as wrong, not unmarked", () => {
    expect(gradeAnswer(question(), [])).toEqual({ earned: 0, correct: false })
  })

  it("ignores case and surrounding space on short answers", () => {
    const q = question({ type: "short-answer", options: [], correctAnswers: ["Twelve"] })
    expect(gradeAnswer(q, ["  twelve "])).toEqual({ earned: 2, correct: true })
  })

  it("accepts any of several short-answer alternatives", () => {
    const q = question({ type: "short-answer", options: [], correctAnswers: ["12", "twelve"] })
    expect(gradeAnswer(q, ["twelve"]).correct).toBe(true)
    expect(gradeAnswer(q, ["12"]).correct).toBe(true)
  })

  it("requires every option on select-all, in any order", () => {
    const q = question({
      type: "multiple-select",
      options: ["a", "b", "c"],
      correctAnswers: ["a", "c"],
    })
    expect(gradeAnswer(q, ["c", "a"]).correct).toBe(true)
    // Missing one is not partial credit.
    expect(gradeAnswer(q, ["a"]).correct).toBe(false)
    // An extra wrong pick loses the mark too.
    expect(gradeAnswer(q, ["a", "b", "c"]).correct).toBe(false)
  })

  it("leaves essays for a human", () => {
    const q = question({ type: "essay", options: [], correctAnswers: [] })
    expect(gradeAnswer(q, ["A long answer"])).toEqual({ earned: null, correct: null })
  })

  it("leaves a question with no answer key unmarked rather than scoring zero", () => {
    const q = question({ correctAnswers: [] })
    expect(gradeAnswer(q, ["12"])).toEqual({ earned: null, correct: null })
  })
})

describe("totalAttempt", () => {
  it("sums marked answers against the paper's total", () => {
    const questions = [question(), question({ points: 3 })]
    const answers = [
      { question: "a", earned: 2 },
      { question: "b", earned: 1 },
    ]
    expect(totalAttempt(questions, answers)).toEqual({
      score: 3,
      maxScore: 5,
      fullyGraded: true,
    })
  })

  it("stays ungraded while an answer is still awaiting marking", () => {
    const questions = [question(), question({ type: "essay", points: 8 })]
    const answers = [
      { question: "a", earned: 2 },
      { question: "b", earned: null },
    ]
    const totals = totalAttempt(questions, answers)

    expect(totals.fullyGraded).toBe(false)
    // The unmarked essay contributes nothing yet, so the score can only rise.
    expect(totals.score).toBe(2)
    expect(totals.maxScore).toBe(10)
  })
})
