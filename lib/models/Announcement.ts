import mongoose, { Schema, type Model, type Document, type Types } from "mongoose"

/** Who an announcement is aimed at. "all" means everyone who can see it. */
export const ANNOUNCEMENT_AUDIENCES = ["all", "students", "teachers", "parents"] as const
export type AnnouncementAudience = (typeof ANNOUNCEMENT_AUDIENCES)[number]

export interface IAnnouncementReply {
  _id?: Types.ObjectId
  author: Types.ObjectId
  body: string
  createdAt: Date
}

export interface IAnnouncement extends Document {
  _id: Types.ObjectId
  title: string
  content: string
  author: Types.ObjectId
  /** Absent means school-wide; set means it only shows inside that course. */
  course?: Types.ObjectId
  audience: AnnouncementAudience
  priority: "high" | "medium" | "low"
  pinned: boolean
  // Replies are embedded: they're always read with their announcement and are
  // never queried on their own, so this avoids a join per page load.
  replies: IAnnouncementReply[]
  createdAt: Date
  updatedAt: Date
}

const ReplySchema = new Schema<IAnnouncementReply>({
  author: { type: Schema.Types.ObjectId, ref: "User", required: true },
  body: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now },
})

const AnnouncementSchema = new Schema<IAnnouncement>(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: Schema.Types.ObjectId, ref: "Course" },
    audience: { type: String, enum: ANNOUNCEMENT_AUDIENCES, default: "all" },
    priority: { type: String, enum: ["high", "medium", "low"], default: "medium" },
    pinned: { type: Boolean, default: false },
    replies: { type: [ReplySchema], default: [] },
  },
  { timestamps: true },
)

// The list view sorts pinned-first then newest, filtered by course.
AnnouncementSchema.index({ course: 1, pinned: -1, createdAt: -1 })

export const Announcement: Model<IAnnouncement> =
  (mongoose.models.Announcement as Model<IAnnouncement>) ??
  mongoose.model<IAnnouncement>("Announcement", AnnouncementSchema)
