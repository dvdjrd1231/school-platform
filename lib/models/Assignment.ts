import mongoose, { Schema, type Model, type Document, type Types } from "mongoose"

export interface IAssignment extends Document {
  _id: Types.ObjectId
  title: string
  description?: string
  course: Types.ObjectId
  createdBy: Types.ObjectId
  dueDate: Date
  points: number
  /** Weight category used by the weighted-GPA calculation. */
  category: "homework" | "quiz" | "exam" | "project" | "participation"
  status: "draft" | "published" | "closed"
  allowLateSubmission: boolean
  /** Percentage deducted per day late when allowLateSubmission is true. */
  latePenaltyPerDay: number
  attachments: { name: string; url: string; size?: number }[]
  createdAt: Date
  updatedAt: Date
}

const AttachmentSchema = new Schema(
  { name: { type: String, required: true }, url: { type: String, required: true }, size: Number },
  { _id: false },
)

const AssignmentSchema = new Schema<IAssignment>(
  {
    title: { type: String, required: true, trim: true },
    description: String,
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    dueDate: { type: Date, required: true },
    points: { type: Number, required: true, min: 0 },
    category: {
      type: String,
      enum: ["homework", "quiz", "exam", "project", "participation"],
      default: "homework",
    },
    status: { type: String, enum: ["draft", "published", "closed"], default: "draft" },
    allowLateSubmission: { type: Boolean, default: true },
    latePenaltyPerDay: { type: Number, default: 10, min: 0, max: 100 },
    attachments: { type: [AttachmentSchema], default: [] },
  },
  { timestamps: true },
)

AssignmentSchema.index({ course: 1, status: 1, dueDate: 1 })

export const Assignment: Model<IAssignment> =
  (mongoose.models.Assignment as Model<IAssignment>) ??
  mongoose.model<IAssignment>("Assignment", AssignmentSchema)
