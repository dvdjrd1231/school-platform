import mongoose, { Schema, type Model, type Document, type Types } from "mongoose"

/**
 * A messaging thread between two or more users (typically a parent and a
 * teacher, optionally about a specific student).
 */
export interface IConversation extends Document {
  _id: Types.ObjectId
  participants: Types.ObjectId[]
  subject?: string
  /** Optional student the conversation concerns, for parent-teacher threads. */
  regardingStudent?: Types.ObjectId
  course?: Types.ObjectId
  lastMessage?: string
  lastMessageAt?: Date
  /** Per-participant unread counts, keyed by stringified user id. */
  unreadCounts: Map<string, number>
  createdAt: Date
  updatedAt: Date
}

const ConversationSchema = new Schema<IConversation>(
  {
    participants: {
      type: [{ type: Schema.Types.ObjectId, ref: "User" }],
      required: true,
      validate: {
        validator: (v: Types.ObjectId[]) => v.length >= 2,
        message: "A conversation needs at least two participants",
      },
    },
    subject: String,
    regardingStudent: { type: Schema.Types.ObjectId, ref: "User" },
    course: { type: Schema.Types.ObjectId, ref: "Course" },
    lastMessage: String,
    lastMessageAt: Date,
    unreadCounts: { type: Map, of: Number, default: () => new Map<string, number>() },
  },
  { timestamps: true },
)

// Inbox query: "conversations I'm in, most recent first".
ConversationSchema.index({ participants: 1, lastMessageAt: -1 })

export const Conversation: Model<IConversation> =
  (mongoose.models.Conversation as Model<IConversation>) ??
  mongoose.model<IConversation>("Conversation", ConversationSchema)
