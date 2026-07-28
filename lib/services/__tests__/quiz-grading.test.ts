import { describe, expect, it } from "vitest"

import { countBlanks, gradeAnswer, seededShuffle, totalAttempt } from "@/lib/services/quiz-grading"
import type { IQuizQuestion } from "@/lib/models/Quiz"

function question(overrides: Partial<IQuizQuestion> = {}): IQuizQuestion {
  return {
    prompt: "What is 3 × 4?",
    type: "multiple-choice",
    options: ["10", "12", "14"],
    correctAnswers: ["12"],
    pairs: [],
    points: 2,
    required: false,
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

  describe("fill in the blank", () => {
    const q = question({
      type: "fill-blank",
      prompt: "The capital of France is ___ and it sits on the ___.",
      options: [],
      // One entry per blank; "|" separates alternatives accepted for that blank.
      correctAnswers: ["Paris", "Seine|River Seine"],
    })

    it("accepts every blank filled correctly", () => {
      expect(gradeAnswer(q, ["paris", "  the seine "]).correct).toBe(false)
      expect(gradeAnswer(q, ["Paris", "Seine"]).correct).toBe(true)
    })

    it("accepts any listed alternative for a blank", () => {
      expect(gradeAnswer(q, ["paris", "river seine"]).correct).toBe(true)
    })

    it("marks it wrong when a single blank is wrong", () => {
      expect(gradeAnswer(q, ["Paris", "Thames"]).correct).toBe(false)
    })

    it("marks it wrong when a blank is left empty", () => {
      expect(gradeAnswer(q, ["Paris"]).correct).toBe(false)
    })
  })

  describe("matching", () => {
    const q = question({
      type: "matching",
      options: [],
      correctAnswers: [],
      pairs: [
        { left: "Dog", right: "Puppy" },
        { left: "Cat", right: "Kitten" },
        { left: "Sheep", right: "Lamb" },
      ],
    })

    it("marks every pair matched correctly", () => {
      expect(gradeAnswer(q, ["Puppy", "Kitten", "Lamb"]).correct).toBe(true)
    })

    it("marks it wrong when one pair is swapped", () => {
      expect(gradeAnswer(q, ["Puppy", "Lamb", "Kitten"]).correct).toBe(false)
    })

    it("marks it wrong when a pair is left unmatched", () => {
      expect(gradeAnswer(q, ["Puppy", "Kitten"]).correct).toBe(false)
    })
  })

  describe("ordering", () => {
    // `options` is stored in the correct sequence.
    const q = question({
      type: "ordering",
      options: ["Plant the seed", "Water it", "It sprouts", "It flowers"],
      correctAnswers: [],
    })

    it("marks the right sequence correct", () => {
      expect(
        gradeAnswer(q, ["Plant the seed", "Water it", "It sprouts", "It flowers"]).correct,
      ).toBe(true)
    })

    it("marks a wrong sequence incorrect even with the same items", () => {
      expect(
        gradeAnswer(q, ["Water it", "Plant the seed", "It sprouts", "It flowers"]).correct,
      ).toBe(false)
    })
  })
})

describe("seededShuffle", () => {
  const items = ["a", "b", "c", "d", "e", "f"]

  it("is stable for the same seed, so options don't jump between renders", () => {
    expect(seededShuffle(items, "attempt-1")).toEqual(seededShuffle(items, "attempt-1"))
  })

  it("differs between seeds, so two students see different orders", () => {
    expect(seededShuffle(items, "attempt-1")).not.toEqual(seededShuffle(items, "attempt-2"))
  })

  it("keeps every item exactly once", () => {
    expect([...seededShuffle(items, "x")].sort()).toEqual([...items].sort())
  })

  it("leaves the input untouched", () => {
    const original = [...items]
    seededShuffle(items, "x")
    expect(items).toEqual(original)
  })
})

describe("countBlanks", () => {
  it("counts each ___ marker in the prompt", () => {
    expect(countBlanks("The capital of France is ___ on the ___.")).toBe(2)
    expect(countBlanks("No blanks here")).toBe(0)
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
