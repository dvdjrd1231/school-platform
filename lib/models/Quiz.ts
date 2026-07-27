import mongoose, { Schema, type Model, type Document, type Types } from "mongoose"

export const QUESTION_TYPES = [
  "multiple-choice",
  "multiple-select",
  "true-false",
  "short-answer",
  "essay",
] as const
export type QuestionType = (typeof QUESTION_TYPES)[number]

/** Everything except an essay can be marked by the platform. */
export function isAutoGradable(type: QuestionType): boolean {
  return type !== "essay"
}

export interface IQuizQuestion {
  _id?: Types.ObjectId
  prompt: string
  type: QuestionType
  /** Choices for multiple-choice / multiple-select. */
  options: string[]
  /**
   * Accepted answers. For choice questions these are option texts; for
   * short-answer, any one of them matches (compared case- and space-insensitively).
   * Empty for essays, which a teacher marks.
   */
  correctAnswers: string[]
  points: number
  /** Shown after submission when the quiz reveals answers. */
  explanation?: string
  order: number
}

export interface IQuiz extends Document {
  _id: Types.ObjectId
  title: string
  description?: string
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
  /** Reveal correct answers and explanations after submitting. */
  showAnswers: boolean
  shuffleQuestions: boolean
  dueDate?: Date
  status: "draft" | "published"
  createdBy: Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const QuestionSchema = new Schema<IQuizQuestion>({
  prompt: { type: String, required: true },
  type: { type: String, enum: QUESTION_TYPES, default: "multiple-choice" },
  options: { type: [String], default: [] },
  correctAnswers: { type: [String], default: [] },
  points: { type: Number, default: 1, min: 0 },
  explanation: String,
  order: { type: Number, default: 0 },
})

const QuizSchema = new Schema<IQuiz>(
  {
    title: { type: String, required: true, trim: true },
    description: String,
    kind: { type: String, enum: ["quiz", "test", "practice"], default: "quiz" },
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    lesson: Schema.Types.ObjectId,
    questions: { type: [QuestionSchema], default: [] },
    timeLimit: { type: Number, default: 0, min: 0 },
    attemptsAllowed: { type: Number, default: 1, min: 0 },
    showAnswers: { type: Boolean, default: true },
    shuffleQuestions: { type: Boolean, default: false },
    dueDate: Date,
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
)

QuizSchema.index({ course: 1, status: 1 })
QuizSchema.index({ lesson: 1 })

export const Quiz: Model<IQuiz> =
  (mongoose.models.Quiz as Model<IQuiz>) ?? mongoose.model<IQuiz>("Quiz", QuizSchema)
