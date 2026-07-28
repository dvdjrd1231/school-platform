import mongoose, { Schema, type Model, type Document, type Types } from "mongoose"

/** How a student hands work in. `none` is for work done off the platform. */
export const SUBMISSION_TYPES = ["file", "text", "link", "image", "media", "none"] as const
export type SubmissionType = (typeof SUBMISSION_TYPES)[number]

/**
 * File groups a teacher can allow, rather than making them type MIME types.
 * Resolved to extensions and MIME prefixes in lib/services/submission-rules.ts.
 */
export const FILE_TYPE_GROUPS = ["pdf", "doc", "slides", "sheet", "image", "video", "audio", "zip"] as const
export type FileTypeGroup = (typeof FILE_TYPE_GROUPS)[number]

export interface IRubricRow {
  criterion: string
  description?: string
  points: number
}

export interface IAssignment extends Document {
  _id: Types.ObjectId
  title: string
  description?: string
  /** Long-form instructions, sanitised HTML from the rich-text editor. */
  instructions?: string
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
  /** Shown to students in place of the deadline once it has passed. */
  lateMessage?: string

  // How work is handed in.
  submissionType: SubmissionType
  allowedFileTypes: FileTypeGroup[]
  /** Megabytes, per file. */
  maxFileSizeMb: number
  maxFiles: number
  /** 0 means unlimited. */
  attemptsAllowed: number
  allowResubmission: boolean

  // Marking.
  rubric: IRubricRow[]
  gradingInstructions?: string
  groupAssignment: boolean

  attachments: { name: string; url: string; size?: number; fileId?: Types.ObjectId }[]
  createdAt: Date
  updatedAt: Date
}

const AttachmentSchema = new Schema(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    size: Number,
    fileId: Schema.Types.ObjectId,
  },
  { _id: false },
)

const RubricSchema = new Schema<IRubricRow>(
  {
    criterion: { type: String, required: true },
    description: String,
    points: { type: Number, required: true, min: 0 },
  },
  { _id: false },
)

const AssignmentSchema = new Schema<IAssignment>(
  {
    title: { type: String, required: true, trim: true },
    description: String,
    instructions: String,
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
    lateMessage: String,

    // Defaults describe how the platform behaved before these existed: a typed
    // response, one attempt, resubmission until marked.
    submissionType: { type: String, enum: SUBMISSION_TYPES, default: "text" },
    allowedFileTypes: { type: [{ type: String, enum: FILE_TYPE_GROUPS }], default: [] },
    maxFileSizeMb: { type: Number, default: 25, min: 1, max: 500 },
    maxFiles: { type: Number, default: 1, min: 1, max: 20 },
    attemptsAllowed: { type: Number, default: 0, min: 0, max: 50 },
    allowResubmission: { type: Boolean, default: true },

    rubric: { type: [RubricSchema], default: [] },
    gradingInstructions: String,
    groupAssignment: { type: Boolean, default: false },

    attachments: { type: [AttachmentSchema], default: [] },
  },
  { timestamps: true },
)

AssignmentSchema.index({ course: 1, status: 1, dueDate: 1 })

export const Assignment: Model<IAssignment> =
  (mongoose.models.Assignment as Model<IAssignment>) ??
  mongoose.model<IAssignment>("Assignment", AssignmentSchema)
