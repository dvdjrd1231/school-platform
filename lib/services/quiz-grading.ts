import type { IQuizQuestion, QuestionType } from "@/lib/models/Quiz"
import { isAutoGradable } from "@/lib/models/Quiz"

/**
 * Marking a quiz.
 *
 * Kept separate from the route so the rules are testable and there is exactly
 * one definition of "correct" — the same function decides the score whether the
 * platform marks it or a teacher later adjusts one answer.
 */

/** Trim, collapse inner whitespace, lowercase. Answers shouldn't hinge on spacing. */
function normalise(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase()
}

export interface GradedAnswer {
  earned: number | null
  correct: boolean | null
}

/** Mark one answer. Returns nulls for an essay, which needs a human. */
export function gradeAnswer(question: IQuizQuestion, response: string[]): GradedAnswer {
  if (!isAutoGradable(question.type)) return { earned: null, correct: null }

  const given = response.map(normalise).filter(Boolean)
  const expected = question.correctAnswers.map(normalise).filter(Boolean)

  // A question with no answer key can't be marked wrong — treat it as unmarked
  // rather than silently scoring zero on the teacher's behalf.
  if (expected.length === 0) return { earned: null, correct: null }

  let correct: boolean

  if (question.type === "multiple-select") {
    // Every right option and no wrong ones. Partial credit isn't offered:
    // "mostly right" on a select-all is a marking policy, not a default.
    const givenSet = new Set(given)
    const expectedSet = new Set(expected)
    correct =
      givenSet.size === expectedSet.size && [...expectedSet].every((value) => givenSet.has(value))
  } else {
    // Single-response types: any one of the accepted answers matches.
    correct = given.length > 0 && expected.includes(given[0])
  }

  return { earned: correct ? question.points : 0, correct }
}

export interface AttemptTotals {
  score: number
  maxScore: number
  fullyGraded: boolean
}

/** Roll marked answers up into a total. Unmarked answers hold the total back. */
export function totalAttempt(
  questions: IQuizQuestion[],
  answers: { question: unknown; earned: number | null }[],
): AttemptTotals {
  const maxScore = questions.reduce((sum, q) => sum + q.points, 0)
  const score = answers.reduce((sum, a) => sum + (a.earned ?? 0), 0)
  const fullyGraded = answers.every((a) => a.earned !== null)

  return { score, maxScore, fullyGraded }
}

/** Does this question type present a list of options to choose from? */
export function hasOptions(type: QuestionType): boolean {
  return type === "multiple-choice" || type === "multiple-select" || type === "true-false"
}
