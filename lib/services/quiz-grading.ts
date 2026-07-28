// `import type` only: this module is reached from client components (the quiz
// screen re-exports its helpers), and a value import from the model would pull
// Mongoose into the browser bundle.
import type { IQuizQuestion } from "@/lib/models/Quiz"
import { isAutoGradable } from "@/lib/quizzes/question-types"

/**
 * Marking a quiz.
 *
 * Kept separate from the route so the rules are testable and there is exactly
 * one definition of "correct" — the same function decides the score whether the
 * platform marks it or a teacher later adjusts one answer.
 */

// Re-exported so callers that already import from here keep working.
export {
  countBlanks,
  hasChoiceOptions,
  seededShuffle,
  type QuestionType,
} from "@/lib/quizzes/question-types"

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

  const award = (correct: boolean): GradedAnswer => ({
    earned: correct ? question.points : 0,
    correct,
  })

  switch (question.type) {
    case "matching": {
      // The student sends one right-hand value per pair, in the pairs' order.
      // A question with no pairs has no answer key, so it can't be marked.
      if (question.pairs.length === 0) return { earned: null, correct: null }
      if (response.length !== question.pairs.length) return award(false)
      return award(
        question.pairs.every((pair, i) => normalise(response[i] ?? "") === normalise(pair.right)),
      )
    }

    case "ordering": {
      // `options` is stored in the correct sequence; the student returns their
      // own ordering of the same items.
      if (question.options.length === 0) return { earned: null, correct: null }
      if (response.length !== question.options.length) return award(false)
      return award(
        question.options.every((option, i) => normalise(response[i] ?? "") === normalise(option)),
      )
    }

    case "fill-blank": {
      // One entry in correctAnswers per blank; `|` separates alternatives that
      // are all acceptable for that blank. Every blank must be right.
      const blanks = question.correctAnswers.filter((a) => a.trim())
      if (blanks.length === 0) return { earned: null, correct: null }
      if (response.length < blanks.length) return award(false)
      return award(
        blanks.every((accepted, i) => {
          const alternatives = accepted.split("|").map(normalise).filter(Boolean)
          return alternatives.includes(normalise(response[i] ?? ""))
        }),
      )
    }

    case "multiple-select": {
      const expected = question.correctAnswers.map(normalise).filter(Boolean)
      if (expected.length === 0) return { earned: null, correct: null }
      // Every right option and no wrong ones. Partial credit isn't offered:
      // "mostly right" on a select-all is a marking policy, not a default.
      const given = new Set(response.map(normalise).filter(Boolean))
      const expectedSet = new Set(expected)
      return award(
        given.size === expectedSet.size && [...expectedSet].every((value) => given.has(value)),
      )
    }

    default: {
      // Single-response types: any one of the accepted answers matches.
      const expected = question.correctAnswers.map(normalise).filter(Boolean)
      if (expected.length === 0) return { earned: null, correct: null }
      const given = response.map(normalise).filter(Boolean)
      return award(given.length > 0 && expected.includes(given[0]))
    }
  }
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

