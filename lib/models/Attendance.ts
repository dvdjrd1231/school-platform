import mongoose, { Schema, type Model, type Document, type Types } from "mongoose"

export const ATTENDANCE_STATUSES = ["present", "absent", "late", "excused"] as const
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number]

export interface IAttendance extends Document {
  _id: Types.ObjectId
  course: Types.ObjectId
  student: Types.ObjectId
  /** Midnight local for the day being recorded — one record per student per day. */
  date: Date
  status: AttendanceStatus
  note?: string
  recordedBy: Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    student: { type: Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    status: { type: String, enum: ATTENDANCE_STATUSES, required: true },
    note: String,
    recordedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
)

// One mark per student per class per day, enforced by the database so a
// double-submitted register can't create two conflicting records.
AttendanceSchema.index({ course: 1, student: 1, date: 1 }, { unique: true })
AttendanceSchema.index({ student: 1, date: -1 })

export const Attendance: Model<IAttendance> =
  (mongoose.models.Attendance as Model<IAttendance>) ??
  mongoose.model<IAttendance>("Attendance", AttendanceSchema)
