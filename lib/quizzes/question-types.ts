/**
 * Question-type facts and pure helpers, with no database dependency.
 *
 * These are needed on both sides: the model and the marking service use them on
 * the server, and the question builder and quiz screen use them in the browser.
 * They live here rather than on the Mongoose model because importing the model
 * from a client component drags Mongoose — and through it `net`, `tls`, `dns` —
 * into the browser bundle, which fails the build.
 */

export const QUESTION_TYPES = [
  "multiple-choice",
  "multiple-select",
  "true-false",
  "fill-blank",
  "short-answer",
  "essay",
  "matching",
  "ordering",
] as const
export type QuestionType = (typeof QUESTION_TYPES)[number]

/** Everything except an essay can be marked by the platform. */
export function isAutoGradable(type: QuestionType): boolean {
  return type !== "essay"
}

/** Question types that present a fixed list of choices. */
export function hasChoiceOptions(type: QuestionType): boolean {
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
 * from the attempt makes it stable there and different between students — and
 * because the seed doesn't change, a student can't reroll the order to work out
 * the original sequence of an ordering question.
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
