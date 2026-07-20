import mongoose, { Schema, type Model, type Document, type Types } from "mongoose"

/**
 * A student's submission for an assignment. Grading lives here rather than in a
 * separate Grade collection: a grade has no meaning without the submission it
 * belongs to, and keeping them together avoids two documents drifting apart.
 */
export interface ISubmission extends Document {
  _id: Types.ObjectId
  assignment: Types.ObjectId
  student: Types.ObjectId
  course: Types.ObjectId
  content?: string
  files: { name: string; url: string; size?: number }[]
  status: "not-started" | "in-progress" | "submitted" | "graded" | "returned"
  submittedAt?: Date
  isLate: boolean
  daysLate: number

  // Grading
  rawScore?: number
  /** Score after late penalty; this is what feeds grade calculations. */
  score?: number
  feedback?: string
  gradedBy?: Types.ObjectId
  gradedAt?: Date

  createdAt: Date
  updatedAt: Date
}

const FileSchema = new Schema(
  { name: { type: String, required: true }, url: { type: String, required: true }, size: Number },
  { _id: false },
)

const SubmissionSchema = new Schema<ISubmission>(
  {
    assignment: { type: Schema.Types.ObjectId, ref: "Assignment", required: true },
    student: { type: Schema.Types.ObjectId, ref: "User", required: true },
    // Denormalised from the assignment so per-course queries (gradebooks,
    // performance dashboards) don't need a lookup on every submission.
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    content: String,
    files: { type: [FileSchema], default: [] },
    status: {
      type: String,
      enum: ["not-started", "in-progress", "submitted", "graded", "returned"],
      default: "not-started",
    },
    submittedAt: Date,
    isLate: { type: Boolean, default: false },
    daysLate: { type: Number, default: 0, min: 0 },

    rawScore: { type: Number, min: 0 },
    score: { type: Number, min: 0 },
    feedback: String,
    gradedBy: { type: Schema.Types.ObjectId, ref: "User" },
    gradedAt: Date,
  },
  { timestamps: true },
)

// One submission per student per assignment; resubmission updates in place.
SubmissionSchema.index({ assignment: 1, student: 1 }, { unique: true })
SubmissionSchema.index({ student: 1, course: 1 })
SubmissionSchema.index({ course: 1, status: 1 })

export const Submission: Model<ISubmission> =
  (mongoose.models.Submission as Model<ISubmission>) ??
  mongoose.model<ISubmission>("Submission", SubmissionSchema)
