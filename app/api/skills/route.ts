import { z } from "zod"

import { Skill } from "@/lib/models"
import { handleErrors, json, parseBody, requireRole } from "@/lib/api/helpers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/skills — the standards catalog, filterable by grade level, category,
 * or subject. Staff only (this is the definition list, not a student's report).
 */
export async function GET(req: Request) {
  try {
    await requireRole("teacher", "admin")
    const url = new URL(req.url)
    const filter: Record<string, unknown> = {}
    const grade = url.searchParams.get("gradeLevel")
    const category = url.searchParams.get("category")
    const subject = url.searchParams.get("subject")
    if (grade) filter.gradeLevel = grade
    if (category) filter.category = category
    if (subject) filter.subject = subject

    const skills = await Skill.find(filter).sort({ gradeLevel: 1, category: 1, order: 1, name: 1 }).lean()
    const gradeLevels = await Skill.distinct("gradeLevel")
    return json({ skills, gradeLevels: gradeLevels.sort() })
  } catch (err) {
    return handleErrors(err)
  }
}

const createSchema = z.object({
  name: z.string().min(2).max(200),
  category: z.string().min(1).max(100),
  subject: z.string().max(100).optional(),
  gradeLevel: z.string().min(1).max(30),
  standardCode: z.string().max(60).optional(),
  framework: z.string().max(60).optional(),
  description: z.string().max(2000).optional(),
  order: z.number().int().min(0).optional(),
})

/** POST /api/skills — define a new standard/skill. Admin or teacher. */
export async function POST(req: Request) {
  try {
    await requireRole("teacher", "admin")
    const body = await parseBody(req, createSchema)
    const skill = await Skill.create({ ...body, active: true })
    return json(skill.toObject(), 201)
  } catch (err) {
    return handleErrors(err)
  }
}
