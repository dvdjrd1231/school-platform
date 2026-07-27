import mongoose, { Schema, type Model, type Document, type Types } from "mongoose"

export const EVENT_TYPES = [
  "class",
  "assignment",
  "exam",
  "meeting",
  "holiday",
  "event",
] as const
export type EventType = (typeof EVENT_TYPES)[number]

export interface ICalendarEvent extends Document {
  _id: Types.ObjectId
  title: string
  description?: string
  type: EventType
  start: Date
  end?: Date
  allDay: boolean
  location?: string
  /** Absent means a school-wide event everyone sees. */
  course?: Types.ObjectId
  createdBy: Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const CalendarEventSchema = new Schema<ICalendarEvent>(
  {
    title: { type: String, required: true, trim: true },
    description: String,
    type: { type: String, enum: EVENT_TYPES, default: "event" },
    start: { type: Date, required: true },
    end: Date,
    allDay: { type: Boolean, default: false },
    location: String,
    course: { type: Schema.Types.ObjectId, ref: "Course" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
)

// Every view is "events in this window", optionally for one course.
CalendarEventSchema.index({ start: 1 })
CalendarEventSchema.index({ course: 1, start: 1 })

export const CalendarEvent: Model<ICalendarEvent> =
  (mongoose.models.CalendarEvent as Model<ICalendarEvent>) ??
  mongoose.model<ICalendarEvent>("CalendarEvent", CalendarEventSchema)
