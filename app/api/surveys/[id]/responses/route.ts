import { z } from "zod"

import { Survey, SurveyResponse } from "@/lib/models"
import {
  ApiError,
  assertObjectId,
  handleErrors,
  json,
  parseBody,
  requireUser,
} from "@/lib/api/helpers"

export const runtime = "nodejs"

interface Params {
  params: Promise<{ id: string }>
}

const submitSchema = z.object({
  answers: z
    .array(
      z.object({
        question: z.string(),
        response: z.array(z.string().max(5000)).default([]),
      }),
    )
    .default([]),
})

/**
 * POST /api/surveys/:id/responses — submit answers.
 *
 * On an anonymous survey no respondent is stored, so the reply genuinely can't
 * be traced back; the cost is that repeat submissions can't be prevented, which
 * is the usual trade and worth being explicit about.
 */
export async function POST(req: Request, { params }: Params) {
  try {
    const me = await requireUser()
    const { id } = await params
    assertObjectId(id, "survey id")

    const survey = await Survey.findById(id)
    if (!survey) throw new ApiError(404, "Survey not found")
    if (survey.status !== "open") throw new ApiError(409, "This survey isn't open")
    if (survey.closesAt && survey.closesAt < new Date()) {
      throw new ApiError(409, "This survey has closed")
    }
    if (!survey.audience.some((role) => me.roles.includes(role))) {
      throw new ApiError(403, "This survey isn't for you")
    }

    if (!survey.anonymous) {
      const already = await SurveyResponse.exists({ survey: id, respondent: me.id })
      if (already) throw new ApiError(409, "You've already answered this survey")
    }

    const body = await parseBody(req, submitSchema)
    const given = body.answers ?? []

    const answers = survey.questions.map((question) => {
      const match = given.find((a) => a.question === String(question._id))
      const response = (match?.response ?? []).filter((value) => value.trim() !== "")

      if (question.required && response.length === 0) {
        throw new ApiError(400, `"${question.prompt}" is required`)
      }

      return { question: question._id as never, response }
    })

    await SurveyResponse.create({
      survey: id,
      respondent: survey.anonymous ? undefined : me.id,
      answers,
      submittedAt: new Date(),
    })

    return json({ surveyId: id, submitted: true }, 201)
  } catch (err) {
    return handleErrors(err)
  }
}
