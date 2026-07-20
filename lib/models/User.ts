import mongoose, { Schema, type Model, type Document, type Types } from "mongoose"
import bcrypt from "bcryptjs"

export const USER_ROLES = ["student", "teacher", "admin", "parent"] as const
export type UserRole = (typeof USER_ROLES)[number]

export interface IUser extends Document {
  _id: Types.ObjectId
  name: string
  email: string
  passwordHash: string
  roles: UserRole[]
  status: "active" | "inactive"
  avatar?: string

  // Student-specific
  studentId?: string
  gradeLevel?: string
  enrollmentDate?: Date
  dateOfBirth?: Date

  // Teacher-specific
  subject?: string
  department?: string
  officeHours?: string
  bio?: string

  // Parent linkage: a parent may be guardian to several students.
  children: Types.ObjectId[]

  createdAt: Date
  updatedAt: Date
  comparePassword(candidate: string): Promise<boolean>
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email address"],
    },
    // select:false keeps the hash out of every query result by default, so it
    // can't leak through an API route that returns a user document.
    passwordHash: { type: String, required: true, select: false },
    roles: {
      type: [{ type: String, enum: USER_ROLES }],
      required: true,
      default: ["student"],
      validate: {
        validator: (v: UserRole[]) => Array.isArray(v) && v.length > 0,
        message: "User must have at least one role",
      },
    },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    avatar: String,

    studentId: { type: String, sparse: true, unique: true },
    gradeLevel: String,
    enrollmentDate: Date,
    dateOfBirth: Date,

    subject: String,
    department: String,
    officeHours: String,
    bio: String,

    children: [{ type: Schema.Types.ObjectId, ref: "User", default: [] }],
  },
  { timestamps: true },
)

UserSchema.index({ roles: 1, status: 1 })
UserSchema.index({ name: "text", email: "text" })

UserSchema.methods.comparePassword = function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.passwordHash)
}

/** Hash a plaintext password. Cost 12 balances security against serverless CPU time. */
export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12)
}

export const User: Model<IUser> =
  (mongoose.models.User as Model<IUser>) ?? mongoose.model<IUser>("User", UserSchema)
