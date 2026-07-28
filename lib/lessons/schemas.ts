/**
 * Per-type lesson validation.
 *
 * A discriminated union on `type`, so each lesson type has its own required
 * fields and its own rejected ones. This is the server-side half of the rule
 * that the form only *appears* to enforce: hiding a field in the UI does not
 * stop anyone posting it, so the schema drops what doesn't belong and refuses
 * what's missing.
 */

import { z } from "zod"

import {
  ACTIVITY_METHODS,
  BUILTIN_ACTIVITIES,
  COMPLETION_RULES,
  VIDEO_SOURCES,
  isRuleAllowed,
  type LessonType,
} from "@/lib/lessons/types"
import { isYoutubeUrl } from "@/lib/media/youtube"

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Not a valid id")

const materialSchema = z.object({
  name: z.string().min(1).max(300),
  url: z.string().min(1).max(2000),
  size: z.number().nonnegative().optional(),
  fileId: objectId.optional(),
})

const completionSchema = z.object({
  rule: z.enum(COMPLETION_RULES),
  watchPercent: z.number().int().min(1).max(100).optional(),
  minScore: z.number().min(0).max(100).optional(),
})

/** Fields every lesson type carries, whatever it is. */
const sharedFields = {
  title: z.string().trim().min(2, "Give the lesson a title").max(200),
  description: z.string().trim().max(500).optional(),
  duration: z.string().trim().max(60).optional(),
  status: z.enum(["draft", "published"]).default("draft"),
  availableFrom: z.coerce.date().optional(),
  completion: completionSchema,
  materials: z.array(materialSchema).max(30).default([]),
}

/** A link, or nothing. Empty strings are treated as "not set", not as invalid. */
const optionalUrl = z
  .union([z.string().url("Enter a full link starting with http:// or https://"), z.literal("")])
  .optional()
  .transform((v) => (v ? v : undefined))

const readingSchema = z.object({
  type: z.literal("reading"),
  ...sharedFields,
  reading: z.object({
    // Sanitised server-side before storage — see lib/lessons/sanitise.ts.
    content: z.string().max(200_000).optional(),
    externalUrl: optionalUrl,
    teacherNotes: z.string().max(5000).optional(),
  }),
})

const videoSchema = z.object({
  type: z.literal("video"),
  ...sharedFields,
  video: z
    .object({
      source: z.enum(VIDEO_SOURCES).default("youtube"),
      url: z.string().max(2000).optional(),
      durationSeconds: z.number().int().min(0).max(86_400).optional(),
      transcript: z.string().max(200_000).optional(),
      notes: z.string().max(50_000).optional(),
    })
    .superRefine((value, ctx) => {
      // A video lesson with no video is the one thing this type cannot be, and
      // a link that isn't YouTube would render an empty player rather than an
      // error — so it's rejected here, not discovered by a student later.
      if (!value.url?.trim()) {
        ctx.addIssue({ code: "custom", message: "Add the YouTube link", path: ["url"] })
        return
      }
      if (!isYoutubeUrl(value.url)) {
        ctx.addIssue({
          code: "custom",
          message: "Video lessons take YouTube links only",
          path: ["url"],
        })
      }
    }),
})

const interactiveSchema = z.object({
  type: z.literal("interactive"),
  ...sharedFields,
  interactive: z
    .object({
      method: z.enum(ACTIVITY_METHODS),
      url: optionalUrl,
      fileId: objectId.optional(),
      builtinActivity: z.enum(BUILTIN_ACTIVITIES).optional(),
      instructions: z.string().max(20_000).optional(),
      passingScore: z.number().min(0).max(100).optional(),
      attempts: z.number().int().min(0).max(50).default(0),
      feedback: z.string().max(5000).optional(),
    })
    .superRefine((value, ctx) => {
      if (value.method === "link" || value.method === "embed") {
        if (!value.url) {
          ctx.addIssue({ code: "custom", message: "Add the activity link", path: ["url"] })
        }
      }
      if (value.method === "upload" && !value.fileId) {
        ctx.addIssue({ code: "custom", message: "Upload the activity package", path: ["fileId"] })
      }
      if (value.method === "builtin" && !value.builtinActivity) {
        ctx.addIssue({
          code: "custom",
          message: "Choose an activity type",
          path: ["builtinActivity"],
        })
      }
    }),
})

const quizSchema = z.object({
  type: z.literal("quiz"),
  ...sharedFields,
  // The quiz itself is created through /api/quizzes; the lesson only points at
  // it. The route creates one when this is absent.
  quiz: z.object({ quizId: objectId.optional() }).default({}),
})

const assignmentSchema = z.object({
  type: z.literal("assignment"),
  ...sharedFields,
  assignment: z.object({ assignmentId: objectId.optional() }).default({}),
})

/**
 * The full lesson body. `discriminatedUnion` is what makes the stripping
 * automatic: Zod parses against the branch matching `type` and drops every key
 * the branch doesn't declare, so a payload carrying a leftover `video` block on
 * a reading lesson simply loses it.
 */
export const lessonBodySchema = z
  .discriminatedUnion("type", [
    readingSchema,
    videoSchema,
    interactiveSchema,
    quizSchema,
    assignmentSchema,
  ])
  .superRefine((value, ctx) => {
    // The rule has to belong to the type — "watch 80%" makes no sense on a
    // reading lesson, and the UI shouldn't be the only thing saying so.
    if (!isRuleAllowed(value.type as LessonType, value.completion.rule)) {
      ctx.addIssue({
        code: "custom",
        message: `"${value.completion.rule}" isn't a completion rule for a ${value.type} lesson`,
        path: ["completion", "rule"],
      })
    }
    if (value.completion.rule === "watch-percent" && !value.completion.watchPercent) {
      ctx.addIssue({
        code: "custom",
        message: "Set the percentage students must watch",
        path: ["completion", "watchPercent"],
      })
    }
    if (value.completion.rule === "min-score" && value.completion.minScore == null) {
      ctx.addIssue({
        code: "custom",
        message: "Set the score students must reach",
        path: ["completion", "minScore"],
      })
    }
  })

export type LessonBody = z.infer<typeof lessonBodySchema>

/**
 * The payload keys, so a write can clear the ones that don't apply.
 *
 * Zod dropping unknown keys stops bad data arriving, but an *update* also has to
 * remove what a lesson already had — converting a video lesson to a reading one
 * must leave no `video` block behind.
 */
export const PAYLOAD_KEYS = ["reading", "video", "interactive", "quiz", "assignment"] as const

/** Every payload key except the one this type owns. */
export function foreignPayloadKeys(type: LessonType): string[] {
  return PAYLOAD_KEYS.filter((key) => key !== type)
}
