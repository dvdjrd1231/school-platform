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

/** Does this question type present a list of options to choose from? */
export function hasOptions(type: QuestionType): boolean {
  return type === "multiple-choice" || type === "multiple-select" || type === "true-false"
}

/**
 * How many blanks a fill-in-the-blank prompt has.
 *
 * Teachers mark them with `___` (three or more underscores), which reads
 * naturally in the prompt itself rather than needing separate fields.
 */
export function countBlanks(prompt: string): number {
  return (prompt.match(/_{3,}/g) ?? []).length
}

/**
 * Deterministic shuffle driven by a seed.
 *
 * Shuffling per render would move the options under the student's cursor on
 * every keystroke, so the order has to be stable for a given attempt. Seeding
 * from the attempt makes it stable there and different between students.
 */
export function seededShuffle<T>(items: T[], seed: string): T[] {
  // xmur3-style string hash, then a small LCG — enough for presentation order.
  let h = 1779033703 ^ seed.length
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  let state = h >>> 0

  const next = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 4294967296
  }

  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}
