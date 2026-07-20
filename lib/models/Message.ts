import mongoose, { Schema, type Model, type Document, type Types } from "mongoose"

export interface IMessage extends Document {
  _id: Types.ObjectId
  conversation: Types.ObjectId
  sender: Types.ObjectId
  body: string
  attachments: { name: string; url: string; size?: number }[]
  /** Users who have read this message. */
  readBy: Types.ObjectId[]
  editedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const AttachmentSchema = new Schema(
  { name: { type: String, required: true }, url: { type: String, required: true }, size: Number },
  { _id: false },
)

const MessageSchema = new Schema<IMessage>(
  {
    conversation: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, required: true, trim: true, maxlength: 10_000 },
    attachments: { type: [AttachmentSchema], default: [] },
    readBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    editedAt: Date,
  },
  { timestamps: true },
)

MessageSchema.index({ conversation: 1, createdAt: -1 })

export const Message: Model<IMessage> =
  (mongoose.models.Message as Model<IMessage>) ??
  mongoose.model<IMessage>("Message", MessageSchema)
