/**
 * Deciding whether a student has actually met a lesson's completion rule.
 *
 * Some rules are checkable and some are not, and it is worth being honest about
 * which is which:
 *
 *  - `manual`, `open`, `scroll`, `watch-percent`, `watch-all`, `all-sections`
 *    are claims the browser makes. Nothing stops someone posting the claim
 *    without doing the work, and no server-side check can tell the difference,
 *    so these are accepted. They exist to shape the student's path, not to
 *    police it.
 *
 *  - `submit`, `min-score`, `activity` are backed by records — a quiz attempt,
 *    a submission — so they are checked properly. These are the ones that gate
 *    a mark, and they are enforced here rather than trusted from the client.
 *
 *  - `teacher` is never satisfiable by the student at all.
 */

import { Assignment, Quiz, QuizAttempt, Submission } from "@/lib/models"
import type { NormalisedLesson } from "@/lib/lessons/normalise"

export interface CompletionCheck {
  allowed: boolean
  /** Why it was refused, shown to the student. */
  reason?: string
}

const OK: CompletionCheck = { allowed: true }

export async function canCompleteLesson(
  lesson: NormalisedLesson,
  studentId: string,
): Promise<CompletionCheck> {
  const { rule, minScore } = lesson.completion

  if (rule === "teacher") {
    return { allowed: false, reason: "Your teacher marks this lesson complete." }
  }

  // Quiz lessons: a submitted attempt, and the passing score when required.
  if (lesson.type === "quiz") {
    const quizId = lesson.quiz?.quizId
    if (!quizId) return { allowed: false, reason: "This quiz hasn't been set up yet." }

    const attempts = await QuizAttempt.find({ quiz: quizId, student: studentId })
      .select("score maxScore")
      .lean()

    if (attempts.length === 0) {
      return { allowed: false, reason: "Take the quiz first." }
    }

    if (rule === "min-score") {
      const quiz = await Quiz.findById(quizId).select("passingScore").lean()
      const required = minScore ?? quiz?.passingScore ?? 0
      const best = Math.max(
        ...attempts.map((a) => (a.maxScore > 0 ? (a.score / a.maxScore) * 100 : 0)),
      )
      if (best < required) {
        return {
          allowed: false,
          reason: `You need ${required}% to pass — your best so far is ${Math.round(best)}%.`,
        }
      }
    }
    return OK
  }

  // Assignment lessons: work has to have been handed in.
  if (lesson.type === "assignment") {
    const assignmentId = lesson.assignment?.assignmentId
    if (!assignmentId) return { allowed: false, reason: "This assignment hasn't been set up yet." }

    const assignment = await Assignment.findById(assignmentId).select("submissionType").lean()
    // "No online submission" means the work happens off the platform, so there
    // is nothing to check and the student marks it done themselves.
    if (assignment?.submissionType === "none") return OK

    const submitted = await Submission.exists({ assignment: assignmentId, student: studentId })
    if (!submitted) return { allowed: false, reason: "Submit your work first." }
    return OK
  }

  // A reading or video lesson can require its attached practice to be passed.
  if (rule === "activity") {
    const quizzes = await Quiz.find({ lesson: lesson._id, status: "published" })
      .select("_id passingScore")
      .lean()

    if (quizzes.length === 0) {
      // The rule says "complete the attached activity" and there isn't one.
      // Blocking would strand the student on a lesson they cannot finish.
      return OK
    }

    for (const quiz of quizzes) {
      const attempts = await QuizAttempt.find({ quiz: quiz._id, student: studentId })
        .select("score maxScore")
        .lean()

      if (attempts.length === 0) {
        return { allowed: false, reason: "Complete the practice problems first." }
      }

      const required = minScore ?? quiz.passingScore ?? 0
      if (required > 0) {
        const best = Math.max(
          ...attempts.map((a) => (a.maxScore > 0 ? (a.score / a.maxScore) * 100 : 0)),
        )
        if (best < required) {
          return {
            allowed: false,
            reason: `You need ${required}% on the practice problems — your best is ${Math.round(best)}%.`,
          }
        }
      }
    }
    return OK
  }

  // Everything else is a client-side claim; see the note at the top.
  return OK
}
