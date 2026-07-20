import mongoose, { Schema, type Model, type Document, type Types } from "mongoose"

export interface INotification extends Document {
  _id: Types.ObjectId
  user: Types.ObjectId
  title: string
  message: string
  type: "assignment" | "grade" | "announcement" | "discussion" | "message" | "system"
  priority: "high" | "medium" | "low"
  isRead: boolean
  actionUrl?: string
  relatedId?: Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const NotificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ["assignment", "grade", "announcement", "discussion", "message", "system"],
      default: "system",
    },
    priority: { type: String, enum: ["high", "medium", "low"], default: "medium" },
    isRead: { type: Boolean, default: false },
    actionUrl: String,
    relatedId: Schema.Types.ObjectId,
  },
  { timestamps: true },
)

NotificationSchema.index({ user: 1, isRead: 1, createdAt: -1 })

export const Notification: Model<INotification> =
  (mongoose.models.Notification as Model<INotification>) ??
  mongoose.model<INotification>("Notification", NotificationSchema)
