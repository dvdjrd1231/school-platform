import mongoose, { Schema, type Model, type Document, type Types } from "mongoose"

/**
 * A skill / competency drawn from a standards framework, scoped to a grade
 * level. This is the catalog an administrator maintains; a student's actual
 * proficiency lives in SkillAssessment.
 */
export interface ISkill extends Document {
  _id: Types.ObjectId
  name: string
  /** Grouping shown as a section in the report, e.g. "Mathematics". */
  category: string
  subject?: string
  /** Which grade this standard applies to, e.g. "6th", "10th". */
  gradeLevel: string
  /** The standard's official code, e.g. "CCSS.MATH.CONTENT.6.RP.A.1". */
  standardCode?: string
  /** The framework the standard comes from, e.g. "Common Core", "NGSS", "TEKS". */
  framework?: string
  description?: string
  order: number
  active: boolean
  createdAt: Date
  updatedAt: Date
}

const SkillSchema = new Schema<ISkill>(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    subject: { type: String, trim: true },
    gradeLevel: { type: String, required: true, trim: true },
    standardCode: { type: String, trim: true },
    framework: { type: String, trim: true },
    description: String,
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
)

// The report and the assessment UI both query "skills for this grade level".
SkillSchema.index({ gradeLevel: 1, category: 1, order: 1 })
// A standard code should not be duplicated within a grade level. A partial
// index (not sparse) is required: sparse only skips a compound key when the
// FIRST field is absent, so several skills with no code but the same grade
// would collide on null. The partial filter indexes only rows that have a code.
SkillSchema.index(
  { gradeLevel: 1, standardCode: 1 },
  { unique: true, partialFilterExpression: { standardCode: { $type: "string" } } },
)

export const Skill: Model<ISkill> =
  (mongoose.models.Skill as Model<ISkill>) ?? mongoose.model<ISkill>("Skill", SkillSchema)
