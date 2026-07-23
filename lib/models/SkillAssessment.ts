import mongoose, { Schema, type Model, type Document, type Types } from "mongoose"

export const SKILL_LEVELS = ["not-assessed", "developing", "proficient", "advanced", "mastered"] as const
export type SkillLevel = (typeof SKILL_LEVELS)[number]

/** Percentage a level represents, for the report's progress bars and overall score. */
export const LEVEL_PERCENT: Record<SkillLevel, number> = {
  "not-assessed": 0,
  developing: 55,
  proficient: 75,
  advanced: 90,
  mastered: 100,
}

/**
 * One student's proficiency on one skill, recorded by a teacher or admin.
 * Separate from the Skill catalog so assessments never duplicate the standard's
 * definition and a student can be re-assessed over time in place.
 */
export interface ISkillAssessment extends Document {
  _id: Types.ObjectId
  student: Types.ObjectId
  skill: Types.ObjectId
  level: SkillLevel
  notes?: string
  assessedBy?: Types.ObjectId
  assessedAt: Date
  createdAt: Date
  updatedAt: Date
}

const SkillAssessmentSchema = new Schema<ISkillAssessment>(
  {
    student: { type: Schema.Types.ObjectId, ref: "User", required: true },
    skill: { type: Schema.Types.ObjectId, ref: "Skill", required: true },
    level: { type: String, enum: SKILL_LEVELS, default: "not-assessed" },
    notes: String,
    assessedBy: { type: Schema.Types.ObjectId, ref: "User" },
    assessedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
)

// One assessment per student per skill; re-assessing updates in place.
SkillAssessmentSchema.index({ student: 1, skill: 1 }, { unique: true })

export const SkillAssessment: Model<ISkillAssessment> =
  (mongoose.models.SkillAssessment as Model<ISkillAssessment>) ??
  mongoose.model<ISkillAssessment>("SkillAssessment", SkillAssessmentSchema)
