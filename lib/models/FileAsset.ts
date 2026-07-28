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
  "seminar",
  "lesson",
  "report",
  "avatar",
  "submission",
] as const
export type FileContext = (typeof FILE_CONTEXTS)[number]

/**
 * What an item actually is.
 *
 * `file` is bytes we store. `youtube` is a link — the video lives on YouTube,
 * which handles the storage, the transcoding and the bandwidth. Both appear in
 * the same lists and obey the same categories, visibility and permissions, so a
 * media area is one collection rather than two that have to be merged on read.
 */
export const ASSET_KINDS = ["file", "youtube"] as const
export type AssetKind = (typeof ASSET_KINDS)[number]

export interface IFileAsset extends Document {
  _id: Types.ObjectId
  kind: AssetKind
  filename: string
  contentType: string
  size: number
  /**
   * The GridFS file this record points at. Bytes never live in this document.
   * Absent for a `youtube` item, which has no bytes here at all.
   */
  gridFsId?: Types.ObjectId
  /** The 11-character YouTube video id, for `youtube` items. */
  youtubeId?: string
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
  /**
   * When false the file can be read in the browser but not downloaded — the
   * download endpoint refuses, and the UI offers only the viewer. For library
   * material the school is licensed to show but not distribute.
   *
   * This is a policy control, not DRM: anyone who can see a document can
   * screenshot or print it. It stops casual redistribution, which is what the
   * licensing actually turns on.
   */
  allowDownload: boolean
  downloads: number
  createdAt: Date
  updatedAt: Date
}

const FileAssetSchema = new Schema<IFileAsset>(
  {
    // Defaults to "file" so everything stored before links existed keeps its
    // meaning without a migration.
    kind: { type: String, enum: ASSET_KINDS, default: "file" },
    filename: { type: String, required: true },
    contentType: { type: String, required: true },
    size: { type: Number, required: true },
    // Required only for stored files — a YouTube item has nothing in GridFS.
    gridFsId: {
      type: Schema.Types.ObjectId,
      required: function (this: IFileAsset) {
        return this.kind !== "youtube"
      },
    },
    youtubeId: {
      type: String,
      required: function (this: IFileAsset) {
        return this.kind === "youtube"
      },
    },
    context: { type: String, enum: FILE_CONTEXTS, required: true },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: Schema.Types.ObjectId, ref: "Course" },
    student: { type: Schema.Types.ObjectId, ref: "User" },
    title: String,
    description: String,
    categoryPath: { type: [String], default: [] },
    tags: { type: [String], default: [] },
    visibility: { type: String, enum: ["private", "course", "school"], default: "private" },
    // Defaults to true so every file uploaded before this existed keeps
    // behaving as it did.
    allowDownload: { type: Boolean, default: true },
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
