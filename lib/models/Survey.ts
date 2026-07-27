import mongoose, { Schema, type Model, type Document, type Types } from "mongoose"

export const SURVEY_QUESTION_TYPES = ["single", "multiple", "rating", "text"] as const
export type SurveyQuestionType = (typeof SURVEY_QUESTION_TYPES)[number]

export interface ISurveyQuestion {
  _id?: Types.ObjectId
  prompt: string
  type: SurveyQuestionType
  options: string[]
  required: boolean
  order: number
}

export interface ISurvey extends Document {
  _id: Types.ObjectId
  title: string
  description?: string
  /** Which roles are asked to fill it in. */
  audience: ("student" | "parent" | "teacher")[]
  /** Narrow the audience to one class; omit to ask everyone in those roles. */
  course?: Types.ObjectId
  questions: ISurveyQuestion[]
  /** Responses are stored without a respondent, so nobody can be identified. */
  anonymous: boolean
  closesAt?: Date
  status: "draft" | "open" | "closed"
  createdBy: Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const SurveyQuestionSchema = new Schema<ISurveyQuestion>({
  prompt: { type: String, required: true },
  type: { type: String, enum: SURVEY_QUESTION_TYPES, default: "single" },
  options: { type: [String], default: [] },
  required: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
})

const SurveySchema = new Schema<ISurvey>(
  {
    title: { type: String, required: true, trim: true },
    description: String,
    audience: {
      type: [{ type: String, enum: ["student", "parent", "teacher"] }],
      default: ["student"],
    },
    course: { type: Schema.Types.ObjectId, ref: "Course" },
    questions: { type: [SurveyQuestionSchema], default: [] },
    anonymous: { type: Boolean, default: false },
    closesAt: Date,
    status: { type: String, enum: ["draft", "open", "closed"], default: "draft" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
)

SurveySchema.index({ status: 1, audience: 1 })

export const Survey: Model<ISurvey> =
  (mongoose.models.Survey as Model<ISurvey>) ?? mongoose.model<ISurvey>("Survey", SurveySchema)

export interface ISurveyResponse extends Document {
  _id: Types.ObjectId
  survey: Types.ObjectId
  /** Absent on an anonymous survey — deliberately, so it can't be traced back. */
  respondent?: Types.ObjectId
  answers: { question: Types.ObjectId; response: string[] }[]
  submittedAt: Date
}

const SurveyResponseSchema = new Schema<ISurveyResponse>(
  {
    survey: { type: Schema.Types.ObjectId, ref: "Survey", required: true },
    respondent: { type: Schema.Types.ObjectId, ref: "User" },
    answers: {
      type: [
        new Schema(
          {
            question: { type: Schema.Types.ObjectId, required: true },
            response: { type: [String], default: [] },
          },
          { _id: false },
        ),
      ],
      default: [],
    },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
)

SurveyResponseSchema.index({ survey: 1, respondent: 1 })

export const SurveyResponse: Model<ISurveyResponse> =
  (mongoose.models.SurveyResponse as Model<ISurveyResponse>) ??
  mongoose.model<ISurveyResponse>("SurveyResponse", SurveyResponseSchema)
