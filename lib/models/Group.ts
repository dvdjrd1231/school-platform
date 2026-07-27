import mongoose, { Schema, type Model, type Document, type Types } from "mongoose"

/**
 * A study group inside a class: a named set of students who work together, with
 * an optional teacher as its lead.
 *
 * The client asked what groups are for, since the screen was empty. This is the
 * definition we've implemented: teachers split a class into working groups (or
 * students form their own), and each group has its own members list and its own
 * discussion thread on the board.
 */
export interface IGroup extends Document {
  _id: Types.ObjectId
  name: string
  description?: string
  course: Types.ObjectId
  members: Types.ObjectId[]
  createdBy: Types.ObjectId
  /** 0 means no cap. */
  maxMembers: number
  /** open: anyone in the class may join. closed: the owner adds people. */
  joinPolicy: "open" | "closed"
  createdAt: Date
  updatedAt: Date
}

const GroupSchema = new Schema<IGroup>(
  {
    name: { type: String, required: true, trim: true },
    description: String,
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    maxMembers: { type: Number, default: 0, min: 0 },
    joinPolicy: { type: String, enum: ["open", "closed"], default: "open" },
  },
  { timestamps: true },
)

GroupSchema.index({ course: 1, name: 1 }, { unique: true })

export const Group: Model<IGroup> =
  (mongoose.models.Group as Model<IGroup>) ?? mongoose.model<IGroup>("Group", GroupSchema)
