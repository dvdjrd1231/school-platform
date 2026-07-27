import mongoose, { Schema, type Model, type Document, type Types } from "mongoose"

/**
 * The admin-editable filing tree used across media, the library, portfolios and
 * the seminar area — e.g. 1st Grade › Math › Unit 1 › Lesson 1.1.
 *
 * Depth is not fixed: the client's example is four levels, but nothing here
 * enforces that, so a school can file things however it works for them.
 */
export interface ICategory extends Document {
  _id: Types.ObjectId
  name: string
  parent?: Types.ObjectId | null
  /**
   * Names from the root down to and including this node. Denormalised so a file
   * can be filtered by path without walking the tree on every query; rebuilt
   * whenever a node is renamed or moved.
   */
  path: string[]
  order: number
  createdAt: Date
  updatedAt: Date
}

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true },
    parent: { type: Schema.Types.ObjectId, ref: "Category", default: null },
    path: { type: [String], default: [] },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
)

// Two children of the same parent can't share a name, or the path becomes
// ambiguous and files filed under it can't be told apart.
CategorySchema.index({ parent: 1, name: 1 }, { unique: true })

export const Category: Model<ICategory> =
  (mongoose.models.Category as Model<ICategory>) ??
  mongoose.model<ICategory>("Category", CategorySchema)
