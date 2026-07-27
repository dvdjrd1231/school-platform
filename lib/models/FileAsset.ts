import mongoose, { Schema, type Model, type Document, type Types } from "mongoose"

/**
 * Where an uploaded file belongs. One collection with a `context` discriminator
 * keeps the media library, the class gallery, e-portfolios, lesson materials,
 * report cards and profile photos on one storage path rather than six.
 */
export const FILE_CONTEXTS = [
  "media",
  "gallery",
  "library",
  "portfolio",
  "lesson",
  "report",
  "avatar",
  "submission",
] as const
export type FileContext = (typeof FILE_CONTEXTS)[number]

export interface IFileAsset extends Document {
  _id: Types.ObjectId
  filename: string
  contentType: string
  size: number
  /** The GridFS file this record points at. Bytes never live in this document. */
  gridFsId: Types.ObjectId
  context: FileContext
  owner: Types.ObjectId
  /** Set for anything class-scoped: gallery items, lesson materials, reports. */
  course?: Types.ObjectId
  /** For report cards: the student the document is about. */
  student?: Types.ObjectId
  title?: string
  description?: string
  /** Path through the admin-defined taxonomy, e.g. ["1st Grade","Math","Unit 1"]. */
  categoryPath: string[]
  tags: string[]
  /**
   * Visibility:
   *  - private: only the owner (and admins)
   *  - course:  anyone in `course`
   *  - school:  every signed-in user
   */
  visibility: "private" | "course" | "school"
  downloads: number
  createdAt: Date
  updatedAt: Date
}

const FileAssetSchema = new Schema<IFileAsset>(
  {
    filename: { type: String, required: true },
    contentType: { type: String, required: true },
    size: { type: Number, required: true },
    gridFsId: { type: Schema.Types.ObjectId, required: true },
    context: { type: String, enum: FILE_CONTEXTS, required: true },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: Schema.Types.ObjectId, ref: "Course" },
    student: { type: Schema.Types.ObjectId, ref: "User" },
    title: String,
    description: String,
    categoryPath: { type: [String], default: [] },
    tags: { type: [String], default: [] },
    visibility: { type: String, enum: ["private", "course", "school"], default: "private" },
    downloads: { type: Number, default: 0 },
  },
  { timestamps: true },
)

FileAssetSchema.index({ context: 1, owner: 1, createdAt: -1 })
FileAssetSchema.index({ context: 1, course: 1, createdAt: -1 })
FileAssetSchema.index({ categoryPath: 1 })

export const FileAsset: Model<IFileAsset> =
  (mongoose.models.FileAsset as Model<IFileAsset>) ??
  mongoose.model<IFileAsset>("FileAsset", FileAssetSchema)
