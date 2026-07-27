import mongoose, { Schema, type Model, type Document, type Types } from "mongoose"

export interface IQuizAnswer {
  question: Types.ObjectId
  /** What the student gave. Several entries for multiple-select. */
  response: string[]
  /** Null while an essay is still waiting to be marked by hand. */
  earned: number | null
  correct: boolean | null
  /** Teacher's note on a hand-marked answer. */
  feedback?: string
}

export interface IQuizAttempt extends Document {
  _id: Types.ObjectId
  quiz: Types.ObjectId
  student: Types.ObjectId
  answers: IQuizAnswer[]
  /** Points earned so far; excludes questions still awaiting marking. */
  score: number
  maxScore: number
  /** True once nothing is left to mark by hand. */
  fullyGraded: boolean
  attemptNumber: number
  startedAt: Date
  submittedAt: Date
  createdAt: Date
  updatedAt: Date
}

const AnswerSchema = new Schema<IQuizAnswer>(
  {
    question: { type: Schema.Types.ObjectId, required: true },
    response: { type: [String], default: [] },
    earned: { type: Number, default: null },
    correct: { type: Boolean, default: null },
    feedback: String,
  },
  { _id: false },
)

const QuizAttemptSchema = new Schema<IQuizAttempt>(
  {
    quiz: { type: Schema.Types.ObjectId, ref: "Quiz", required: true },
    student: { type: Schema.Types.ObjectId, ref: "User", required: true },
    answers: { type: [AnswerSchema], default: [] },
    score: { type: Number, default: 0 },
    maxScore: { type: Number, default: 0 },
    fullyGraded: { type: Boolean, default: false },
    attemptNumber: { type: Number, default: 1 },
    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
)

QuizAttemptSchema.index({ quiz: 1, student: 1, attemptNumber: 1 })

export const QuizAttempt: Model<IQuizAttempt> =
  (mongoose.models.QuizAttempt as Model<IQuizAttempt>) ??
  mongoose.model<IQuizAttempt>("QuizAttempt", QuizAttemptSchema)
