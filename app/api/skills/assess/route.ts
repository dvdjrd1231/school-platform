import { z } from "zod"

import { Skill, SkillAssessment, SKILL_LEVELS, User } from "@/lib/models"
import { ApiError, handleErrors, json, parseBody, requireRole } from "@/lib/api/helpers"

export const runtime = "nodejs"

const assessSchema = z.object({
  student: z.string().min(1),
  skill: z.string().min(1),
  level: z.enum(SKILL_LEVELS),
  notes: z.string().max(2000).optional(),
})

/**
 * POST /api/skills/assess — record (or update) a student's proficiency on one
 * skill. Teacher or admin only. Upserts so re-assessing overwrites in place.
 */
export async function POST(req: Request) {
  try {
    const me = await requireRole("teacher", "admin")
    const body = await parseBody(req, assessSchema)

    const [student, skill] = await Promise.all([
      User.findById(body.student).select("roles").lean(),
      Skill.findById(body.skill).select("_id").lean(),
    ])
    if (!student || !student.roles.includes("student")) throw new ApiError(404, "Student not found")
    if (!skill) throw new ApiError(404, "Skill not found")

    const assessment = await SkillAssessment.findOneAndUpdate(
      { student: body.student, skill: body.skill },
      {
        student: body.student,
        skill: body.skill,
        level: body.level,
        notes: body.notes,
        assessedBy: me.id,
        assessedAt: new Date(),
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    )

    return json({
      id: assessment._id.toString(),
      skill: body.skill,
      level: assessment.level,
    })
  } catch (err) {
    return handleErrors(err)
  }
}
