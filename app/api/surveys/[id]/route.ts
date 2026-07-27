import { z } from "zod"

import { Survey, SurveyResponse } from "@/lib/models"
import { SURVEY_QUESTION_TYPES } from "@/lib/models/Survey"
import {
  ApiError,
  assertObjectId,
  handleErrors,
  hasRole,
  json,
  parseBody,
  requireUser,
} from "@/lib/api/helpers"

export const runtime = "nodejs"

interface Params {
  params: Promise<{ id: string }>
}

/** GET /api/surveys/:id — the survey plus, for the owner, its collated results. */
export async function GET(_req: Request, { params }: Params) {
  try {
    const me = await requireUser()
    const { id } = await params
    assertObjectId(id, "survey id")

    const survey = await Survey.findById(id)
      .populate("createdBy", "name")
      .populate("course", "title")
      .lean()
    if (!survey) throw new ApiError(404, "Survey not found")

    const isOwner = String(survey.createdBy?._id ?? survey.createdBy) === me.id
    const canSeeResults = isOwner || hasRole(me, "admin")

    if (!canSeeResults && survey.status !== "open") {
      throw new ApiError(404, "Survey not found")
    }
    if (!canSeeResults && !survey.audience.some((role) => me.roles.includes(role))) {
      throw new ApiError(403, "This survey isn't for you")
    }

    const mine = survey.anonymous
      ? null
      : await SurveyResponse.findOne({ survey: id, respondent: me.id }).lean()

    if (!canSeeResults) {
      return json({
        ...survey,
        canSeeResults: false,
        alreadyAnswered: survey.anonymous ? null : Boolean(mine),
        myResponse: mine?.answers ?? null,
      })
    }

    // Collate: a tally per option for choice questions, the raw text otherwise.
    const responses = await SurveyResponse.find({ survey: id })
      .populate("respondent", "name")
      .lean()

    const results = survey.questions.map((question) => {
      const answers = responses
        .flatMap((r) => r.answers)
        .filter((a) => String(a.question) === String(question._id))

      if (question.type === "text") {
        return {
          question: String(question._id),
          type: question.type,
          texts: answers.map((a) => a.response.join(" ")).filter(Boolean),
        }
      }

      const tally: Record<string, number> = {}
      for (const answer of answers) {
        for (const value of answer.response) {
          tally[value] = (tally[value] ?? 0) + 1
        }
      }

      const numeric = answers
        .flatMap((a) => a.response.map(Number))
        .filter((n) => Number.isFinite(n))

      return {
        question: String(question._id),
        type: question.type,
        tally,
        average:
          question.type === "rating" && numeric.length > 0
            ? Number((numeric.reduce((s, n) => s + n, 0) / numeric.length).toFixed(2))
            : null,
      }
    })

    return json({
      ...survey,
      canSeeResults: true,
      responseCount: responses.length,
      results,
      alreadyAnswered: survey.anonymous ? null : Boolean(mine),
    })
  } catch (err) {
    return handleErrors(err)
  }
}

const questionSchema = z.object({
  prompt: z.string().min(1).max(2000),
  type: z.enum(SURVEY_QUESTION_TYPES),
  options: z.array(z.string().max(300)).max(15).default([]),
  required: z.boolean().default(false),
  order: z.number().int().min(0).default(0),
})

const updateSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  description: z.string().max(5000).optional(),
  audience: z.array(z.enum(["student", "parent", "teacher"])).min(1).optional(),
  questions: z.array(questionSchema).optional(),
  anonymous: z.boolean().optional(),
  closesAt: z.coerce.date().optional(),
  status: z.enum(["draft", "open", "closed"]).optional(),
})

/** PATCH /api/surveys/:id — owner or admin. Opening and closing lives here too. */
export async function PATCH(req: Request, { params }: Params) {
  try {
    const me = await requireUser()
    const { id } = await params
    assertObjectId(id, "survey id")

    const survey = await Survey.findById(id)
    if (!survey) throw new ApiError(404, "Survey not found")
    if (String(survey.createdBy) !== me.id && !hasRole(me, "admin")) {
      throw new ApiError(403, "Only the author or an admin can edit this survey")
    }

    const body = await parseBody(req, updateSchema)

    if (body.questions) {
      const answered = await SurveyResponse.countDocuments({ survey: id })
      if (answered > 0) {
        throw new ApiError(
          409,
          `${answered} response(s) have already come in, so the questions can't be changed.`,
        )
      }
    }

    Object.assign(survey, body)
    await survey.save()

    return json(survey.toObject())
  } catch (err) {
    return handleErrors(err)
  }
}

/** DELETE /api/surveys/:id — removes the survey and its responses. */
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const me = await requireUser()
    const { id } = await params
    assertObjectId(id, "survey id")

    const survey = await Survey.findById(id)
    if (!survey) throw new ApiError(404, "Survey not found")
    if (String(survey.createdBy) !== me.id && !hasRole(me, "admin")) {
      throw new ApiError(403, "Only the author or an admin can delete this survey")
    }

    await SurveyResponse.deleteMany({ survey: id })
    await survey.deleteOne()

    return json({ id, deleted: true })
  } catch (err) {
    return handleErrors(err)
  }
}
