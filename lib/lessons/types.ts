/**
 * The lesson-type registry.
 *
 * One definition of what each lesson type *is* — which fields belong to it,
 * which completion rules it may use, and how it presents. The form, the
 * validation, the server's field-stripping, the student renderer and the module
 * card all read from here, so a type can't mean one thing in the editor and
 * something else when it's saved.
 *
 * Shared by client and server: no imports from either side.
 */

export const LESSON_TYPES = ["reading", "video", "interactive", "quiz", "assignment"] as const
export type LessonType = (typeof LESSON_TYPES)[number]

export function isLessonType(value: unknown): value is LessonType {
  return typeof value === "string" && (LESSON_TYPES as readonly string[]).includes(value)
}

/**
 * How a student finishes a lesson.
 *
 * `manual`, `scroll` and `open` are declarations the browser makes — the server
 * has no way to prove someone read a page or watched a video, so these are
 * accepted on trust. The rest are checked against real records: a quiz attempt,
 * a submission, an activity result. See lib/services/lesson-completion.ts.
 */
export const COMPLETION_RULES = [
  "manual",
  "scroll",
  "open",
  "watch-percent",
  "watch-all",
  "all-sections",
  "min-score",
  "teacher",
  "submit",
  "activity",
] as const
export type CompletionRule = (typeof COMPLETION_RULES)[number]

export interface CompletionOption {
  value: CompletionRule
  label: string
  hint?: string
}

/** The payload key each type stores its own fields under. */
export const TYPE_PAYLOAD_KEY: Record<LessonType, "reading" | "video" | "interactive" | "quiz" | "assignment"> = {
  reading: "reading",
  video: "video",
  interactive: "interactive",
  quiz: "quiz",
  assignment: "assignment",
}

export interface LessonTypeDefinition {
  type: LessonType
  label: string
  /** One line describing what this type is for, shown in the type picker. */
  blurb: string
  /** Lucide icon name — resolved to a component in lib/lessons/icons.tsx. */
  icon: "BookOpen" | "PlayCircle" | "MousePointerClick" | "HelpCircle" | "ClipboardList"
  /** Tailwind classes for the card badge, so every surface tints a type alike. */
  tone: string
  completionRules: CompletionOption[]
  defaultCompletion: CompletionRule
  /**
   * Whether this type owns a separate record (a Quiz or an Assignment) rather
   * than storing its content inline. Those keep their own builders and feed the
   * gradebook, so a lesson links to one instead of duplicating it.
   */
  linkedRecord?: "quiz" | "assignment"
}

export const LESSON_TYPE_DEFINITIONS: Record<LessonType, LessonTypeDefinition> = {
  reading: {
    type: "reading",
    label: "Reading",
    blurb: "Written instruction, passages, articles, or a document to read.",
    icon: "BookOpen",
    tone: "bg-sky-100 text-sky-800",
    defaultCompletion: "manual",
    completionRules: [
      { value: "manual", label: "Mark complete manually" },
      {
        value: "scroll",
        label: "Reach the bottom of the page",
        hint: "Recorded when the student scrolls to the end.",
      },
      {
        value: "activity",
        label: "Complete an attached activity",
        hint: "Requires the attached practice problems to be passed.",
      },
    ],
  },
  video: {
    type: "video",
    label: "Video",
    blurb: "Video instruction, with optional transcript and supporting files.",
    icon: "PlayCircle",
    tone: "bg-violet-100 text-violet-800",
    defaultCompletion: "watch-all",
    completionRules: [
      { value: "open", label: "Open the video" },
      { value: "watch-percent", label: "Watch a percentage of it" },
      { value: "watch-all", label: "Watch the whole video" },
      { value: "activity", label: "Complete a follow-up activity" },
    ],
  },
  interactive: {
    type: "interactive",
    label: "Interactive",
    blurb: "An activity students click, explore, match, sort, or sequence.",
    icon: "MousePointerClick",
    tone: "bg-amber-100 text-amber-800",
    defaultCompletion: "open",
    completionRules: [
      { value: "open", label: "Open the activity" },
      { value: "all-sections", label: "Finish all sections" },
      { value: "min-score", label: "Reach a minimum score" },
      { value: "teacher", label: "Teacher marks it complete" },
    ],
  },
  quiz: {
    type: "quiz",
    label: "Quiz",
    blurb: "An assessment with a question builder and automatic marking.",
    icon: "HelpCircle",
    tone: "bg-emerald-100 text-emerald-800",
    defaultCompletion: "submit",
    linkedRecord: "quiz",
    completionRules: [
      { value: "submit", label: "Submit the quiz" },
      { value: "min-score", label: "Reach the passing score" },
    ],
  },
  assignment: {
    type: "assignment",
    label: "Assignment",
    blurb: "Work the student completes and submits for marking.",
    icon: "ClipboardList",
    tone: "bg-rose-100 text-rose-800",
    defaultCompletion: "submit",
    linkedRecord: "assignment",
    completionRules: [
      { value: "submit", label: "Submit the work" },
      { value: "teacher", label: "Teacher marks it complete" },
    ],
  },
}

export function lessonTypeDefinition(type: LessonType): LessonTypeDefinition {
  return LESSON_TYPE_DEFINITIONS[type]
}

/** Is this completion rule valid for this lesson type? */
export function isRuleAllowed(type: LessonType, rule: CompletionRule): boolean {
  return LESSON_TYPE_DEFINITIONS[type].completionRules.some((r) => r.value === rule)
}

/**
 * Video lessons take YouTube links, and nothing else.
 *
 * Kept as a single-entry list rather than removed: the field still exists on
 * stored lessons, and one source means one player, one preview and one set of
 * failure modes — rather than four half-tested ones. Video files are not
 * uploaded to the platform, which also keeps the database out of the business
 * of storing hundreds of megabytes of media.
 */
export const VIDEO_SOURCES = ["youtube"] as const
export type VideoSource = (typeof VIDEO_SOURCES)[number]

/** How an interactive activity is delivered. */
export const ACTIVITY_METHODS = ["link", "embed", "upload", "builtin"] as const
export type ActivityMethod = (typeof ACTIVITY_METHODS)[number]

/** Built-in activity kinds, used when the method is `builtin`. */
export const BUILTIN_ACTIVITIES = [
  "matching",
  "sorting",
  "drag-and-drop",
  "flashcards",
  "clickable-image",
  "fill-in-the-blank",
  "sequence",
  "multiple-choice",
  "slideshow",
] as const
export type BuiltinActivity = (typeof BUILTIN_ACTIVITIES)[number]

export const BUILTIN_ACTIVITY_LABELS: Record<BuiltinActivity, string> = {
  matching: "Matching",
  sorting: "Sorting",
  "drag-and-drop": "Drag and drop",
  flashcards: "Flashcards",
  "clickable-image": "Clickable image",
  "fill-in-the-blank": "Fill in the blank",
  sequence: "Sequence ordering",
  "multiple-choice": "Multiple-choice practice",
  slideshow: "Interactive slideshow",
}

/**
 * A one-line summary for the lesson card, e.g. "Video · 5 min",
 * "Quiz · 10 points", "Assignment · Due 18 Sep".
 */
export function lessonCardLabel(lesson: {
  type: LessonType
  /** Null as well as undefined: the API returns null for "not set". */
  duration?: string | null
  points?: number | null
  dueDate?: string | Date | null
}): string {
  const { label } = LESSON_TYPE_DEFINITIONS[lesson.type]
  const parts: string[] = [label]

  if (lesson.type === "assignment" && lesson.dueDate) {
    parts.push(
      `Due ${new Date(lesson.dueDate).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
      })}`,
    )
  } else if ((lesson.type === "quiz" || lesson.type === "assignment") && lesson.points != null) {
    parts.push(`${lesson.points} point${lesson.points === 1 ? "" : "s"}`)
  } else if (lesson.duration) {
    parts.push(lesson.duration)
  }

  return parts.join(" · ")
}
