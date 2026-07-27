import mongoose, { Schema, type Model, type Document, type Types } from "mongoose"

export interface IDiscussionReply {
  _id?: Types.ObjectId
  author: Types.ObjectId
  body: string
  createdAt: Date
  editedAt?: Date
}

export interface IDiscussion extends Document {
  _id: Types.ObjectId
  title: string
  content: string
  author: Types.ObjectId
  /** Absent means a school-wide thread anyone signed in can join. */
  course?: Types.ObjectId
  category: string
  pinned: boolean
  /** A locked thread is read-only: no new replies. Teachers/admins set this. */
  locked: boolean
  views: number
  replies: IDiscussionReply[]
  createdAt: Date
  updatedAt: Date
}

const ReplySchema = new Schema<IDiscussionReply>({
  author: { type: Schema.Types.ObjectId, ref: "User", required: true },
  body: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now },
  editedAt: Date,
})

const DiscussionSchema = new Schema<IDiscussion>(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: Schema.Types.ObjectId, ref: "Course" },
    category: { type: String, default: "General" },
    pinned: { type: Boolean, default: false },
    locked: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
    replies: { type: [ReplySchema], default: [] },
  },
  { timestamps: true },
)

// The board lists pinned first, then by most recent activity.
DiscussionSchema.index({ course: 1, pinned: -1, updatedAt: -1 })

export const Discussion: Model<IDiscussion> =
  (mongoose.models.Discussion as Model<IDiscussion>) ??
  mongoose.model<IDiscussion>("Discussion", DiscussionSchema)
