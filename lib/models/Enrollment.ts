import mongoose, { Schema, type Model, type Document, type Types } from "mongoose"

export interface IEnrollment extends Document {
  _id: Types.ObjectId
  student: Types.ObjectId
  course: Types.ObjectId
  status: "active" | "completed" | "dropped" | "pending"
  enrolledAt: Date
  completedAt?: Date
  /** Percentage of lessons marked complete (0-100). */
  progress: number
  completedLessons: Types.ObjectId[]
  finalGrade?: number
  createdAt: Date
  updatedAt: Date
}

const EnrollmentSchema = new Schema<IEnrollment>(
  {
    student: { type: Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    status: {
      type: String,
      enum: ["active", "completed", "dropped", "pending"],
      default: "active",
    },
    enrolledAt: { type: Date, default: Date.now },
    completedAt: Date,
    progress: { type: Number, default: 0, min: 0, max: 100 },
    completedLessons: [{ type: Schema.Types.ObjectId }],
    finalGrade: { type: Number, min: 0, max: 100 },
  },
  { timestamps: true },
)

// A student must not be enrolled in the same course twice. Enforced at the DB
// level so concurrent enrolment requests cannot create duplicates.
EnrollmentSchema.index({ student: 1, course: 1 }, { unique: true })
EnrollmentSchema.index({ course: 1, status: 1 })

export const Enrollment: Model<IEnrollment> =
  (mongoose.models.Enrollment as Model<IEnrollment>) ??
  mongoose.model<IEnrollment>("Enrollment", EnrollmentSchema)
