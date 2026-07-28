import mongoose, { Schema, type Model, type Document, type Types } from "mongoose"

import { QUESTION_TYPES, type QuestionType } from "@/lib/quizzes/question-types"

// Question-type facts live in a database-free module so the browser can use
// them too — see lib/quizzes/question-types.ts. Re-exported here so existing
// server-side imports keep working.
export {
  QUESTION_TYPES,
  isAutoGradable,
  hasChoiceOptions,
  type QuestionType,
} from "@/lib/quizzes/question-types"

export interface IMatchPair {
  left: string
  right: string
}

export interface IQuizQuestion {
  _id?: Types.ObjectId
  prompt: string
  type: QuestionType
  /**
   * Choices for multiple-choice / multiple-select / true-false, and — for
   * `ordering` — the items **in their correct sequence**, shuffled before the
   * student sees them.
   */
  options: string[]
  /**
   * Accepted answers. Choice questions store option texts; short-answer accepts
   * any one of them; `fill-blank` stores one entry per blank, with `|`
   * separating alternatives for that blank. Empty for essays and matching.
   */
  correctAnswers: string[]
  /** For `matching`: the pairs. Right-hand values are shuffled for the student. */
  pairs: IMatchPair[]
  points: number
  /** Shown after submission when the quiz reveals answers. */
  explanation?: string
  /** Optional media shown with the question. */
  media?: { kind: "image" | "audio" | "video"; url: string; fileId?: Types.ObjectId }
  /** A question the student must answer before submitting. */
  required: boolean
  order: number
}

export interface IQuiz extends Document {
  _id: Types.ObjectId
  title: string
  description?: string
  /** Shown to the student before they begin. */
  instructions?: string
  /** quiz and test are graded; practice is for self-checking and isn't. */
  kind: "quiz" | "test" | "practice"
  course: Types.ObjectId
  /** Set when the quiz belongs to a specific lesson — the practice problems. */
  lesson?: Types.ObjectId
  questions: IQuizQuestion[]
  /** Minutes. 0 means untimed. */
  timeLimit: number
  /** How many times a student may submit. 0 means unlimited. */
  attemptsAllowed: number
  /** Percentage needed to pass, used by the `min-score` lesson completion rule. */
  passingScore: number

  // Presentation.
  shuffleQuestions: boolean
  shuffleAnswers: boolean
  oneQuestionAtATime: boolean
  /** When false, the student can't go back to a question they've moved past. */
  allowBacktrack: boolean

  // What the student sees afterwards.
  /** Reveal the score immediately, or hold it until the teacher has reviewed. */
  releaseResults: "immediately" | "after-review"
  showAnswers: boolean
  showExplanations: boolean

  availableFrom?: Date
  dueDate?: Date
  closesAt?: Date
  status: "draft" | "published"
  createdBy: Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const MatchPairSchema = new Schema<IMatchPair>(
  { left: { type: String, required: true }, right: { type: String, required: true } },
  { _id: false },
)

const QuestionMediaSchema = new Schema(
  {
    kind: { type: String, enum: ["image", "audio", "video"], required: true },
    url: { type: String, required: true },
    fileId: Schema.Types.ObjectId,
  },
  { _id: false },
)

const QuestionSchema = new Schema<IQuizQuestion>({
  prompt: { type: String, required: true },
  type: { type: String, enum: QUESTION_TYPES, default: "multiple-choice" },
  options: { type: [String], default: [] },
  correctAnswers: { type: [String], default: [] },
  pairs: { type: [MatchPairSchema], default: [] },
  points: { type: Number, default: 1, min: 0 },
  explanation: String,
  media: QuestionMediaSchema,
  required: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
})

const QuizSchema = new Schema<IQuiz>(
  {
    title: { type: String, required: true, trim: true },
    description: String,
    instructions: String,
    kind: { type: String, enum: ["quiz", "test", "practice"], default: "quiz" },
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    lesson: Schema.Types.ObjectId,
    questions: { type: [QuestionSchema], default: [] },
    timeLimit: { type: Number, default: 0, min: 0 },
    attemptsAllowed: { type: Number, default: 1, min: 0 },
    passingScore: { type: Number, default: 0, min: 0, max: 100 },

    shuffleQuestions: { type: Boolean, default: false },
    shuffleAnswers: { type: Boolean, default: false },
    oneQuestionAtATime: { type: Boolean, default: true },
    allowBacktrack: { type: Boolean, default: true },

    releaseResults: {
      type: String,
      enum: ["immediately", "after-review"],
      default: "immediately",
    },
    showAnswers: { type: Boolean, default: true },
    showExplanations: { type: Boolean, default: true },

    availableFrom: Date,
    dueDate: Date,
    closesAt: Date,
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
)

QuizSchema.index({ course: 1, status: 1 })
QuizSchema.index({ lesson: 1 })

export const Quiz: Model<IQuiz> =
  (mongoose.models.Quiz as Model<IQuiz>) ?? mongoose.model<IQuiz>("Quiz", QuizSchema)
