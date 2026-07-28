/**
 * The lesson form's working state.
 *
 * Shared fields live at the top level; everything type-specific lives in
 * `payload`, which is replaced wholesale when the type changes. That structure
 * is what makes the client's rule enforceable in the UI: there is no way to
 * carry a video's settings into a reading lesson, because the reading form
 * simply has nowhere to put them.
 */

import {
  LESSON_TYPE_DEFINITIONS,
  type CompletionRule,
  type LessonType,
} from "@/lib/lessons/types"
import type { NormalisedLesson } from "@/lib/lessons/normalise"

export interface MaterialDraft {
  name: string
  url: string
  size?: number
  fileId?: string
}

export interface ReadingDraft {
  content: string
  externalUrl: string
  teacherNotes: string
}

export interface VideoDraft {
  source: "youtube" | "vimeo" | "mp4" | "upload"
  url: string
  fileId: string
  durationSeconds: string
  transcript: string
  notes: string
}

export interface InteractiveDraft {
  method: "link" | "embed" | "upload" | "builtin"
  url: string
  fileId: string
  builtinActivity: string
  instructions: string
  passingScore: string
  attempts: string
  feedback: string
}

/** Quiz and assignment lessons edit their linked record through these. */
export interface QuizDraft {
  quizId?: string
}

export interface AssignmentDraft {
  assignmentId?: string
}

export type LessonPayload =
  | { type: "reading"; reading: ReadingDraft }
  | { type: "video"; video: VideoDraft }
  | { type: "interactive"; interactive: InteractiveDraft }
  | { type: "quiz"; quiz: QuizDraft }
  | { type: "assignment"; assignment: AssignmentDraft }

export interface LessonDraft {
  title: string
  description: string
  duration: string
  status: "draft" | "published"
  availableFrom: string
  completionRule: CompletionRule
  watchPercent: string
  minScore: string
  materials: MaterialDraft[]
  courseId: string
  moduleId: string
  moduleTitle: string
  payload: LessonPayload
}

export function blankPayload(type: LessonType): LessonPayload {
  switch (type) {
    case "reading":
      return { type, reading: { content: "", externalUrl: "", teacherNotes: "" } }
    case "video":
      return {
        type,
        video: {
          source: "youtube",
          url: "",
          fileId: "",
          durationSeconds: "",
          transcript: "",
          notes: "",
        },
      }
    case "interactive":
      return {
        type,
        interactive: {
          method: "link",
          url: "",
          fileId: "",
          builtinActivity: "",
          instructions: "",
          passingScore: "",
          attempts: "0",
          feedback: "",
        },
      }
    case "quiz":
      return { type, quiz: {} }
    case "assignment":
      return { type, assignment: {} }
  }
}

export function blankDraft(type: LessonType, courseId: string, moduleId = ""): LessonDraft {
  return {
    title: "",
    description: "",
    duration: "",
    status: "draft",
    availableFrom: "",
    completionRule: LESSON_TYPE_DEFINITIONS[type].defaultCompletion,
    watchPercent: "80",
    minScore: "70",
    materials: [],
    courseId,
    moduleId,
    moduleTitle: "",
    payload: blankPayload(type),
  }
}

/** Load an existing lesson into the form. */
export function draftFromLesson(
  lesson: NormalisedLesson,
  courseId: string,
  moduleId: string,
): LessonDraft {
  const base: LessonDraft = {
    title: lesson.title,
    description: lesson.description ?? "",
    duration: lesson.duration ?? "",
    status: lesson.status,
    availableFrom: lesson.availableFrom ? lesson.availableFrom.slice(0, 16) : "",
    completionRule: lesson.completion.rule,
    watchPercent: String(lesson.completion.watchPercent ?? 80),
    minScore: String(lesson.completion.minScore ?? 70),
    materials: lesson.materials,
    courseId,
    moduleId,
    moduleTitle: "",
    payload: blankPayload(lesson.type),
  }

  switch (lesson.type) {
    case "reading":
      base.payload = {
        type: "reading",
        reading: {
          content: lesson.reading?.content ?? "",
          externalUrl: lesson.reading?.externalUrl ?? "",
          teacherNotes: lesson.reading?.teacherNotes ?? "",
        },
      }
      break
    case "video":
      base.payload = {
        type: "video",
        video: {
          source: (lesson.video?.source as VideoDraft["source"]) ?? "youtube",
          url: lesson.video?.url ?? "",
          fileId: lesson.video?.fileId ?? "",
          durationSeconds: lesson.video?.durationSeconds
            ? String(lesson.video.durationSeconds)
            : "",
          transcript: lesson.video?.transcript ?? "",
          notes: lesson.video?.notes ?? "",
        },
      }
      break
    case "interactive":
      base.payload = {
        type: "interactive",
        interactive: {
          method: (lesson.interactive?.method as InteractiveDraft["method"]) ?? "link",
          url: lesson.interactive?.url ?? "",
          fileId: lesson.interactive?.fileId ?? "",
          builtinActivity: lesson.interactive?.builtinActivity ?? "",
          instructions: lesson.interactive?.instructions ?? "",
          passingScore:
            lesson.interactive?.passingScore != null
              ? String(lesson.interactive.passingScore)
              : "",
          attempts: String(lesson.interactive?.attempts ?? 0),
          feedback: lesson.interactive?.feedback ?? "",
        },
      }
      break
    case "quiz":
      base.payload = { type: "quiz", quiz: { quizId: lesson.quiz?.quizId } }
      break
    case "assignment":
      base.payload = {
        type: "assignment",
        assignment: { assignmentId: lesson.assignment?.assignmentId },
      }
      break
  }

  return base
}

/**
 * Does the current payload hold anything worth warning about before it is
 * discarded?
 *
 * Warning on an untouched form would train people to click through the dialog,
 * so the prompt only appears when there is real work to lose.
 */
export function payloadHasContent(payload: LessonPayload): boolean {
  switch (payload.type) {
    case "reading": {
      const { content, externalUrl, teacherNotes } = payload.reading
      // The editor leaves an empty paragraph behind, which isn't content.
      const stripped = content.replace(/<[^>]*>/g, "").trim()
      return Boolean(stripped || externalUrl.trim() || teacherNotes.trim())
    }
    case "video": {
      const { url, fileId, transcript, notes } = payload.video
      return Boolean(url.trim() || fileId || transcript.trim() || notes.trim())
    }
    case "interactive": {
      const { url, fileId, instructions, builtinActivity, feedback } = payload.interactive
      return Boolean(
        url.trim() || fileId || instructions.trim() || builtinActivity || feedback.trim(),
      )
    }
    // A saved quiz or assignment isn't lost by switching type — it is reverted
    // to a draft and stays under Quizzes/Assignments — but the teacher should
    // still be told the lesson will stop pointing at it.
    case "quiz":
      return Boolean(payload.quiz.quizId)
    case "assignment":
      return Boolean(payload.assignment.assignmentId)
  }
}

/** Turn the form state into the request body the API expects. */
export function draftToBody(draft: LessonDraft): Record<string, unknown> {
  const shared: Record<string, unknown> = {
    title: draft.title.trim(),
    description: draft.description.trim() || undefined,
    duration: draft.duration.trim() || undefined,
    status: draft.status,
    availableFrom: draft.availableFrom ? new Date(draft.availableFrom).toISOString() : undefined,
    completion: {
      rule: draft.completionRule,
      watchPercent:
        draft.completionRule === "watch-percent" ? Number(draft.watchPercent) || 80 : undefined,
      minScore: draft.completionRule === "min-score" ? Number(draft.minScore) || 0 : undefined,
    },
    materials: draft.materials,
  }

  switch (draft.payload.type) {
    case "reading":
      return {
        ...shared,
        type: "reading",
        reading: {
          content: draft.payload.reading.content || undefined,
          externalUrl: draft.payload.reading.externalUrl.trim(),
          teacherNotes: draft.payload.reading.teacherNotes.trim() || undefined,
        },
      }

    case "video": {
      const video = draft.payload.video
      return {
        ...shared,
        type: "video",
        video: {
          source: video.source,
          url: video.source === "upload" ? "" : video.url.trim(),
          fileId: video.source === "upload" ? video.fileId || undefined : undefined,
          durationSeconds: video.durationSeconds ? Number(video.durationSeconds) : undefined,
          transcript: video.transcript.trim() || undefined,
          notes: video.notes.trim() || undefined,
        },
      }
    }

    case "interactive": {
      const activity = draft.payload.interactive
      return {
        ...shared,
        type: "interactive",
        interactive: {
          method: activity.method,
          url: activity.method === "upload" || activity.method === "builtin" ? "" : activity.url.trim(),
          fileId: activity.method === "upload" ? activity.fileId || undefined : undefined,
          builtinActivity:
            activity.method === "builtin" ? activity.builtinActivity || undefined : undefined,
          instructions: activity.instructions.trim() || undefined,
          passingScore: activity.passingScore ? Number(activity.passingScore) : undefined,
          attempts: Number(activity.attempts) || 0,
          feedback: activity.feedback.trim() || undefined,
        },
      }
    }

    case "quiz":
      return { ...shared, type: "quiz", quiz: { quizId: draft.payload.quiz.quizId } }

    case "assignment":
      return {
        ...shared,
        type: "assignment",
        assignment: { assignmentId: draft.payload.assignment.assignmentId },
      }
  }
}
