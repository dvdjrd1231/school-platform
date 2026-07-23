import { Skill, SkillAssessment, User, LEVEL_PERCENT, type SkillLevel } from "@/lib/models"

export interface SkillReportItem {
  skillId: string
  name: string
  standardCode?: string
  framework?: string
  description?: string
  level: SkillLevel
  percent: number
  assessedAt: string | null
}

export interface SkillReportCategory {
  category: string
  items: SkillReportItem[]
}

export interface SkillReport {
  studentId: string
  studentName: string
  gradeLevel: string | null
  categories: SkillReportCategory[]
  summary: {
    total: number
    assessed: number
    mastered: number
    developing: number
    overallPercent: number | null
  }
}

/**
 * Build a student's skills report: every skill defined for their grade level,
 * joined with the student's assessment (or "not-assessed" where none exists),
 * grouped into the categories the report renders as sections.
 *
 * Skills come from the grade-level catalog, so the report reflects the
 * standards an administrator has entered for that grade — not a fixed list.
 */
export async function buildSkillReport(studentId: string): Promise<SkillReport> {
  const student = await User.findById(studentId).select("name gradeLevel").lean()
  const gradeLevel = student?.gradeLevel ?? null

  // A student with no grade level has no standards to measure against.
  const skills = gradeLevel
    ? await Skill.find({ gradeLevel, active: true }).sort({ category: 1, order: 1, name: 1 }).lean()
    : []

  const assessments = await SkillAssessment.find({ student: studentId }).lean()
  const bySkill = new Map(assessments.map((a) => [String(a.skill), a]))

  const categories = new Map<string, SkillReportItem[]>()
  let assessed = 0
  let mastered = 0
  let developing = 0
  let percentSum = 0
  let percentCount = 0

  for (const skill of skills) {
    const a = bySkill.get(String(skill._id))
    const level: SkillLevel = a?.level ?? "not-assessed"
    const percent = LEVEL_PERCENT[level]

    if (level !== "not-assessed") {
      assessed++
      percentSum += percent
      percentCount++
      if (level === "mastered") mastered++
      if (level === "developing") developing++
    }

    const item: SkillReportItem = {
      skillId: String(skill._id),
      name: skill.name,
      standardCode: skill.standardCode,
      framework: skill.framework,
      description: skill.description,
      level,
      percent,
      assessedAt: a?.assessedAt ? new Date(a.assessedAt).toISOString() : null,
    }
    const list = categories.get(skill.category) ?? []
    list.push(item)
    categories.set(skill.category, list)
  }

  return {
    studentId,
    studentName: student?.name ?? "Unknown",
    gradeLevel,
    categories: [...categories.entries()].map(([category, items]) => ({ category, items })),
    summary: {
      total: skills.length,
      assessed,
      mastered,
      developing,
      overallPercent: percentCount > 0 ? Math.round(percentSum / percentCount) : null,
    },
  }
}
