import mongoose, { Schema, type Model, type Document, type Types } from "mongoose"

/**
 * A private study note.
 *
 * Notes belong to whoever wrote them and are never shared — that's what makes
 * them notes rather than a discussion post. They can be tied to a class so they
 * turn up next to the right work.
 */
export interface INote extends Document {
  _id: Types.ObjectId
  title: string
  content: string
  author: Types.ObjectId
  course?: Types.ObjectId
  tags: string[]
  pinned: boolean
  createdAt: Date
  updatedAt: Date
}

const NoteSchema = new Schema<INote>(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, default: "" },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: Schema.Types.ObjectId, ref: "Course" },
    tags: { type: [String], default: [] },
    pinned: { type: Boolean, default: false },
  },
  { timestamps: true },
)

NoteSchema.index({ author: 1, pinned: -1, updatedAt: -1 })

export const Note: Model<INote> =
  (mongoose.models.Note as Model<INote>) ?? mongoose.model<INote>("Note", NoteSchema)
