import mongoose, { Schema, type Model, type Document, type Types } from "mongoose"

export interface ILessonItem {
  _id?: Types.ObjectId
  title: string
  description?: string
  type: "video" | "reading" | "interactive" | "quiz" | "assignment"
  duration?: string
  order: number
  content?: string
  videoUrl?: string
  materials: { name: string; url: string; size?: number }[]
}

export interface IModule {
  _id?: Types.ObjectId
  title: string
  description?: string
  order: number
  status: "locked" | "available" | "in-progress" | "completed"
  unlockDate?: Date
  lessons: ILessonItem[]
}

export interface ICourse extends Document {
  _id: Types.ObjectId
  code: string
  title: string
  description?: string
  subject: string
  instructor: Types.ObjectId
  schedule?: string
  room?: string
  status: "draft" | "active" | "completed" | "upcoming" | "archived"
  maxStudents: number
  startDate?: Date
  endDate?: Date
  // Course content lives embedded: modules are always read with their course
  // and never queried independently, so embedding avoids a join per page load.
  modules: IModule[]
  createdAt: Date
  updatedAt: Date
}

const MaterialSchema = new Schema(
  { name: { type: String, required: true }, url: { type: String, required: true }, size: Number },
  { _id: false },
)

const LessonItemSchema = new Schema<ILessonItem>({
  title: { type: String, required: true },
  description: String,
  type: {
    type: String,
    enum: ["video", "reading", "interactive", "quiz", "assignment"],
    default: "reading",
  },
  duration: String,
  order: { type: Number, required: true },
  content: String,
  videoUrl: String,
  materials: { type: [MaterialSchema], default: [] },
})

const ModuleSchema = new Schema<IModule>({
  title: { type: String, required: true },
  description: String,
  order: { type: Number, required: true },
  status: {
    type: String,
    enum: ["locked", "available", "in-progress", "completed"],
    default: "available",
  },
  unlockDate: Date,
  lessons: { type: [LessonItemSchema], default: [] },
})

const CourseSchema = new Schema<ICourse>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: String,
    subject: { type: String, required: true },
    instructor: { type: Schema.Types.ObjectId, ref: "User", required: true },
    schedule: String,
    room: String,
    status: {
      type: String,
      enum: ["draft", "active", "completed", "upcoming", "archived"],
      default: "draft",
    },
    maxStudents: { type: Number, default: 30, min: 1 },
    startDate: Date,
    endDate: Date,
    modules: { type: [ModuleSchema], default: [] },
  },
  { timestamps: true },
)

CourseSchema.index({ instructor: 1, status: 1 })
CourseSchema.index({ subject: 1 })

export const Course: Model<ICourse> =
  (mongoose.models.Course as Model<ICourse>) ?? mongoose.model<ICourse>("Course", CourseSchema)
