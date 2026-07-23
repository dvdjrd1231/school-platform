import { z } from "zod"

import { Skill, SkillAssessment } from "@/lib/models"
import { ApiError, assertObjectId, handleErrors, json, parseBody, requireRole } from "@/lib/api/helpers"

export const runtime = "nodejs"

type Params = { params: Promise<{ id: string }> }

const updateSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  category: z.string().min(1).max(100).optional(),
  subject: z.string().max(100).optional(),
  gradeLevel: z.string().min(1).max(30).optional(),
  standardCode: z.string().max(60).optional(),
  framework: z.string().max(60).optional(),
  description: z.string().max(2000).optional(),
  order: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
})

/** PATCH /api/skills/:id — edit a standard/skill. Admin or teacher. */
export async function PATCH(req: Request, { params }: Params) {
  try {
    const { id } = await params
    assertObjectId(id, "skill id")
    await requireRole("teacher", "admin")
    const body = await parseBody(req, updateSchema)
    const skill = await Skill.findByIdAndUpdate(id, body, { new: true, runValidators: true }).lean()
    if (!skill) throw new ApiError(404, "Skill not found")
    return json(skill)
  } catch (err) {
    return handleErrors(err)
  }
}

/** DELETE /api/skills/:id — remove a skill and any assessments referencing it. */
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id } = await params
    assertObjectId(id, "skill id")
    await requireRole("teacher", "admin")
    const skill = await Skill.findByIdAndDelete(id)
    if (!skill) throw new ApiError(404, "Skill not found")
    // Assessments of a deleted skill are orphaned data; remove them too.
    await SkillAssessment.deleteMany({ skill: id })
    return json({ id, deleted: true })
  } catch (err) {
    return handleErrors(err)
  }
}
