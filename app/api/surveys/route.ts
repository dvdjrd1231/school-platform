import { z } from "zod"

import { Survey, SurveyResponse } from "@/lib/models"
import { SURVEY_QUESTION_TYPES } from "@/lib/models/Survey"
import {
  handleErrors,
  hasRole,
  json,
  parseBody,
  requireRole,
  requireUser,
} from "@/lib/api/helpers"
import { courseScope } from "@/lib/api/scope"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/surveys
 *
 * Staff see the ones they created plus every open survey aimed at them.
 * Everyone else sees open surveys for a role they hold, with a flag saying
 * whether they've already answered.
 */
export async function GET() {
  try {
    const me = await requireUser()
    const isStaff = hasRole(me, "teacher", "admin")

    // "admin" isn't an audience — an admin is asked things as a teacher.
    const askableRoles = me.roles.filter(
      (role): role is "student" | "parent" | "teacher" => role !== "admin",
    )
    const audienceFilter = { status: "open" as const, audience: { $in: askableRoles } }
    const filter = isStaff
      ? { $or: [{ createdBy: me.id }, audienceFilter] }
      : audienceFilter

    const surveys = await Survey.find(filter)
      .populate("createdBy", "name")
      .populate("course", "title")
      .sort({ createdAt: -1 })
      .lean()

    // Restrict class-scoped surveys to people actually in that class.
    const scope = await courseScope(me)
    const visible = surveys.filter(
      (s) =>
        !s.course ||
        scope.unrestricted ||
        String(s.createdBy?._id ?? s.createdBy) === me.id ||
        scope.ids.includes(String((s.course as { _id?: unknown })._id ?? s.course)),
    )

    const ids = visible.map((s) => s._id)
    const [mine, counts] = await Promise.all([
      SurveyResponse.find({ survey: { $in: ids }, respondent: me.id }).select("survey").lean(),
      SurveyResponse.aggregate<{ _id: unknown; count: number }>([
        { $match: { survey: { $in: ids } } },
        { $group: { _id: "$survey", count: { $sum: 1 } } },
      ]),
    ])

    const answered = new Set(mine.map((r) => String(r.survey)))
    const countMap = new Map(counts.map((c) => [String(c._id), c.count]))

    return json({
      surveys: visible.map((s) => ({
        ...s,
        questionCount: s.questions.length,
        // On an anonymous survey there's no respondent recorded, so "have I
        // answered?" genuinely can't be known — say so rather than guess.
        alreadyAnswered: s.anonymous ? null : answered.has(String(s._id)),
        responseCount: countMap.get(String(s._id)) ?? 0,
        isMine: String(s.createdBy?._id ?? s.createdBy) === me.id,
      })),
    })
  } catch (err) {
    return handleErrors(err)
  }
}

const questionSchema = z.object({
  prompt: z.string().min(1).max(2000),
  type: z.enum(SURVEY_QUESTION_TYPES).default("single"),
  options: z.array(z.string().max(300)).max(15).default([]),
  required: z.boolean().default(false),
  order: z.number().int().min(0).default(0),
})

const createSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(5000).optional(),
  audience: z.array(z.enum(["student", "parent", "teacher"])).min(1).default(["student"]),
  course: z.string().optional(),
  questions: z.array(questionSchema).default([]),
  anonymous: z.boolean().default(false),
  closesAt: z.coerce.date().optional(),
  status: z.enum(["draft", "open", "closed"]).default("draft"),
})

/** POST /api/surveys — teachers and admins create and assign surveys. */
export async function POST(req: Request) {
  try {
    const me = await requireRole("teacher", "admin")
    const body = await parseBody(req, createSchema)

    const survey = await Survey.create({ ...body, createdBy: me.id })
    return json(survey.toObject(), 201)
  } catch (err) {
    return handleErrors(err)
  }
}
