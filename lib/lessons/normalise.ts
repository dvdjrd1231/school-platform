/**
 * Reading a lesson in the typed shape, whatever shape it was saved in.
 *
 * Lessons created before the type-specific form put their body in `content` and
 * their video link in `videoUrl`, regardless of type. Rather than run a
 * migration against a live database — which would have to be right first time —
 * this maps those fields into the typed payload on read. New writes always use
 * the typed payload, so the legacy branch quietly stops being reached as content
 * is edited.
 */

import {
  LESSON_TYPE_DEFINITIONS,
  isLessonType,
  isRuleAllowed,
  type CompletionRule,
  type LessonType,
} from "@/lib/lessons/types"

export interface NormalisedLesson {
  _id: string
  title: string
  description?: string
  type: LessonType
  duration?: string
  order: number
  status: "draft" | "published"
  availableFrom?: string
  completion: { rule: CompletionRule; watchPercent?: number; minScore?: number }
  materials: { name: string; url: string; size?: number; fileId?: string }[]
  reading?: { content?: string; externalUrl?: string; teacherNotes?: string }
  video?: {
    source: string
    url?: string
    fileId?: string
    durationSeconds?: number
    transcript?: string
    notes?: string
  }
  interactive?: {
    method: string
    url?: string
    fileId?: string
    builtinActivity?: string
    instructions?: string
    passingScore?: number
    attempts: number
    feedback?: string
  }
  quiz?: { quizId?: string }
  assignment?: { assignmentId?: string }
}

/**
 * A lesson as it comes back from Mongo — any of the shapes we've ever written.
 *
 * Deliberately loose: this has to accept both a hydrated Mongoose subdocument
 * and a `.lean()` plain object, from before and after the typed payloads
 * existed. Tightening it would mean casting at every call site instead.
 */
interface RawLesson {
  _id?: unknown
  title?: string
  description?: string
  type?: unknown
  duration?: string
  order?: number
  status?: string
  availableFrom?: Date | string | null
  completion?: { rule?: string; watchPercent?: number; minScore?: number } | null
  materials?: { name: string; url: string; size?: number; fileId?: unknown }[]
  reading?: { content?: string; externalUrl?: string; teacherNotes?: string } | null
  video?: {
    source?: unknown
    url?: unknown
    fileId?: unknown
    durationSeconds?: number
    transcript?: unknown
    notes?: unknown
  } | null
  interactive?: {
    method?: unknown
    url?: unknown
    fileId?: unknown
    builtinActivity?: unknown
    instructions?: unknown
    passingScore?: number
    attempts?: number
    feedback?: unknown
  } | null
  quiz?: { quizId?: unknown } | null
  assignment?: { assignmentId?: unknown } | null
  content?: string
  videoUrl?: string
}

const str = (value: unknown): string | undefined =>
  value === undefined || value === null ? undefined : String(value)

/** Guess a video source from the link, for lessons saved before the field existed. */
export function inferVideoSource(url?: string): "youtube" | "vimeo" | "mp4" {
  if (!url) return "youtube"
  if (/youtu\.?be/i.test(url)) return "youtube"
  if (/vimeo/i.test(url)) return "vimeo"
  return "mp4"
}

export function normaliseLesson(raw: RawLesson): NormalisedLesson {
  const type: LessonType = isLessonType(raw.type) ? raw.type : "reading"
  const definition = LESSON_TYPE_DEFINITIONS[type]

  // Fall back to the type's default when the stored rule belongs to a type this
  // lesson no longer is — otherwise a converted lesson keeps an unreachable rule.
  const storedRule = raw.completion?.rule as CompletionRule | undefined
  const rule =
    storedRule && isRuleAllowed(type, storedRule) ? storedRule : definition.defaultCompletion

  const normalised: NormalisedLesson = {
    _id: String(raw._id ?? ""),
    title: raw.title ?? "Untitled lesson",
    description: raw.description,
    type,
    duration: raw.duration,
    order: raw.order ?? 0,
    // Anything written before per-lesson status existed was visible, so it
    // stays visible; treating it as a draft would silently hide live content.
    status: raw.status === "draft" ? "draft" : "published",
    availableFrom: raw.availableFrom ? new Date(raw.availableFrom).toISOString() : undefined,
    completion: {
      rule,
      watchPercent: raw.completion?.watchPercent,
      minScore: raw.completion?.minScore,
    },
    materials: (raw.materials ?? []).map((m) => ({
      name: m.name,
      url: m.url,
      size: m.size,
      fileId: str(m.fileId),
    })),
  }

  switch (type) {
    case "reading":
      normalised.reading = {
        // Prefer the typed payload; fall back to the legacy body.
        content: raw.reading?.content ?? raw.content,
        externalUrl: raw.reading?.externalUrl,
        teacherNotes: raw.reading?.teacherNotes,
      }
      break

    case "video": {
      const url = str(raw.video?.url) ?? raw.videoUrl
      normalised.video = {
        source: str(raw.video?.source) ?? inferVideoSource(url),
        url,
        fileId: str(raw.video?.fileId),
        durationSeconds: raw.video?.durationSeconds as number | undefined,
        transcript: str(raw.video?.transcript),
        // A legacy video lesson's body was written as notes under the player.
        notes: str(raw.video?.notes) ?? raw.content,
      }
      break
    }

    case "interactive":
      normalised.interactive = {
        method: str(raw.interactive?.method) ?? (raw.videoUrl ? "embed" : "link"),
        url: str(raw.interactive?.url) ?? raw.videoUrl,
        fileId: str(raw.interactive?.fileId),
        builtinActivity: str(raw.interactive?.builtinActivity),
        instructions: str(raw.interactive?.instructions) ?? raw.content,
        passingScore: raw.interactive?.passingScore as number | undefined,
        attempts: (raw.interactive?.attempts as number | undefined) ?? 0,
        feedback: str(raw.interactive?.feedback),
      }
      break

    case "quiz":
      normalised.quiz = { quizId: str(raw.quiz?.quizId) }
      break

    case "assignment":
      normalised.assignment = { assignmentId: str(raw.assignment?.assignmentId) }
      break
  }

  return normalised
}
