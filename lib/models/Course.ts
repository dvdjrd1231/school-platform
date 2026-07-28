import mongoose, { Schema, type Model, type Document, type Types } from "mongoose"

import {
  ACTIVITY_METHODS,
  BUILTIN_ACTIVITIES,
  COMPLETION_RULES,
  LESSON_TYPES,
  VIDEO_SOURCES,
  type ActivityMethod,
  type BuiltinActivity,
  type CompletionRule,
  type LessonType,
  type VideoSource,
} from "@/lib/lessons/types"

export interface ILessonMaterial {
  name: string
  /** Either an /api/files/:id/download path or an external link. */
  url: string
  size?: number
  /** Set when the material is a file we host, so deleting the lesson can tidy up. */
  fileId?: Types.ObjectId
}

/** Reading lessons: written content, plus anything to read alongside it. */
export interface IReadingPayload {
  /** Rich text, stored as sanitised HTML. */
  content?: string
  externalUrl?: string
  teacherNotes?: string
}

/** Video lessons: one source, plus the material that sits under the player. */
export interface IVideoPayload {
  source: VideoSource
  /** The link, for youtube/vimeo/mp4. Empty when the video was uploaded. */
  url?: string
  /** The stored file, when source is `upload`. */
  fileId?: Types.ObjectId
  /** Seconds. Detected on upload where possible, otherwise entered by hand. */
  durationSeconds?: number
  transcript?: string
  notes?: string
}

/** Interactive lessons: an activity delivered by link, embed, upload or built in. */
export interface IInteractivePayload {
  method: ActivityMethod
  url?: string
  fileId?: Types.ObjectId
  builtinActivity?: BuiltinActivity
  instructions?: string
  passingScore?: number
  /** 0 means unlimited. */
  attempts: number
  feedback?: string
}

/**
 * Quiz and assignment lessons hold only a reference. The Quiz and Assignment
 * collections already own the question builder, the submission pipeline and the
 * gradebook; duplicating any of that inside a lesson would mean two sources of
 * truth for a mark.
 */
export interface ILinkedPayload {
  quizId?: Types.ObjectId
  assignmentId?: Types.ObjectId
}

export interface ILessonCompletion {
  rule: CompletionRule
  /** For `watch-percent`: how much of the video counts as watched. */
  watchPercent?: number
  /** For `min-score`: the percentage needed to pass. */
  minScore?: number
}

export interface ILessonItem {
  _id?: Types.ObjectId
  title: string
  description?: string
  type: LessonType
  duration?: string
  order: number
  /** Drafts are invisible to students; only staff see them in the module list. */
  status: "draft" | "published"
  /** Optional release date — the lesson stays locked to students until then. */
  availableFrom?: Date
  completion: ILessonCompletion
  materials: ILessonMaterial[]

  // Exactly one of these is populated, matching `type`. The server strips the
  // others on every write, so a lesson never carries settings from a type it
  // used to be.
  reading?: IReadingPayload
  video?: IVideoPayload
  interactive?: IInteractivePayload
  quiz?: ILinkedPayload
  assignment?: ILinkedPayload

  /** @deprecated Pre-typed-lesson field, still read for lessons saved before
   * the type-specific form existed. Normalised into `reading.content` /
   * `video.url` on read — see lib/lessons/normalise.ts. */
  content?: string
  /** @deprecated See `content`. */
  videoUrl?: string
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
  /** The physical classroom, e.g. "B12". Not the year group — see gradeLevel. */
  room?: string
  /**
   * The year group this class is for, e.g. "1st Grade". Drives promotion: when
   * a student moves up, their old grade's classes close and the new grade's
   * open. Optional, so a mixed-age or elective class can leave it unset.
   */
  gradeLevel?: string
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

const MaterialSchema = new Schema<ILessonMaterial>(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    size: Number,
    fileId: Schema.Types.ObjectId,
  },
  { _id: false },
)

const ReadingSchema = new Schema<IReadingPayload>(
  { content: String, externalUrl: String, teacherNotes: String },
  { _id: false },
)

const VideoSchema = new Schema<IVideoPayload>(
  {
    source: { type: String, enum: VIDEO_SOURCES, default: "youtube" },
    url: String,
    fileId: Schema.Types.ObjectId,
    durationSeconds: Number,
    transcript: String,
    notes: String,
  },
  { _id: false },
)

const InteractiveSchema = new Schema<IInteractivePayload>(
  {
    method: { type: String, enum: ACTIVITY_METHODS, default: "link" },
    url: String,
    fileId: Schema.Types.ObjectId,
    builtinActivity: { type: String, enum: BUILTIN_ACTIVITIES },
    instructions: String,
    passingScore: { type: Number, min: 0, max: 100 },
    attempts: { type: Number, default: 0, min: 0 },
    feedback: String,
  },
  { _id: false },
)

const LinkedSchema = new Schema<ILinkedPayload>(
  {
    quizId: { type: Schema.Types.ObjectId, ref: "Quiz" },
    assignmentId: { type: Schema.Types.ObjectId, ref: "Assignment" },
  },
  { _id: false },
)

const CompletionSchema = new Schema<ILessonCompletion>(
  {
    rule: { type: String, enum: COMPLETION_RULES, default: "manual" },
    watchPercent: { type: Number, min: 1, max: 100 },
    minScore: { type: Number, min: 0, max: 100 },
  },
  { _id: false },
)

const LessonItemSchema = new Schema<ILessonItem>({
  title: { type: String, required: true },
  description: String,
  type: { type: String, enum: LESSON_TYPES, default: "reading" },
  duration: String,
  order: { type: Number, required: true },
  // Defaults to published so lessons created before this field existed stay
  // visible; new lessons are created explicitly as one or the other.
  status: { type: String, enum: ["draft", "published"], default: "published" },
  availableFrom: Date,
  completion: { type: CompletionSchema, default: () => ({ rule: "manual" }) },
  materials: { type: [MaterialSchema], default: [] },

  reading: ReadingSchema,
  video: VideoSchema,
  interactive: InteractiveSchema,
  quiz: LinkedSchema,
  assignment: LinkedSchema,

  // Legacy, read-only in practice. Kept in the schema so Mongoose doesn't drop
  // them from documents written before the typed payloads existed.
  content: String,
  videoUrl: String,
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
    gradeLevel: String,
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
