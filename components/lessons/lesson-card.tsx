"use client"

import { CalendarClock, CheckCircle, Eye, Lock, Pencil } from "lucide-react"

import { cn } from "@/lib/utils"
import { LESSON_TYPE_DEFINITIONS, lessonCardLabel, type LessonType } from "@/lib/lessons/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LessonTypeBadge } from "@/components/lessons/lesson-type-icon"

export interface LessonCardData {
  _id: string
  title: string
  description?: string
  type: LessonType
  duration?: string
  status: "draft" | "published"
  availableFrom?: string
  points?: number | null
  dueDate?: string | null
}

interface Props {
  lesson: LessonCardData
  index: number
  completed: boolean
  unlocked: boolean
  canEdit: boolean
  onOpen: () => void
  onEdit?: () => void
  onPreview?: () => void
}

/**
 * One lesson in a module list.
 *
 * Every type gets its own icon, tint and label line — "Video · 5 min",
 * "Quiz · 10 points", "Assignment · Due 18 Sep" — so the list reads as a set of
 * different things rather than five identical rows.
 */
export function LessonCard({
  lesson,
  index,
  completed,
  unlocked,
  canEdit,
  onOpen,
  onEdit,
  onPreview,
}: Props) {
  const definition = LESSON_TYPE_DEFINITIONS[lesson.type]
  const label = lessonCardLabel(lesson)
  const scheduled = lesson.availableFrom && new Date(lesson.availableFrom) > new Date()

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors",
        unlocked ? "cursor-pointer hover:bg-emerald-50" : "cursor-not-allowed bg-muted/40",
        lesson.status === "draft" && "border-dashed",
      )}
      onClick={() => unlocked && onOpen()}
      role="button"
      tabIndex={unlocked ? 0 : -1}
      aria-disabled={!unlocked}
      onKeyDown={(e) => {
        if (!unlocked) return
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onOpen()
        }
      }}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="w-5 shrink-0 text-xs text-muted-foreground">{index + 1}.</span>

        {completed ? (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-4 w-4 text-green-700" />
          </span>
        ) : unlocked ? (
          <LessonTypeBadge type={lesson.type} />
        ) : (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
            <Lock className="h-4 w-4 text-muted-foreground" />
          </span>
        )}

        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{lesson.title}</p>
          <p className="truncate text-xs text-muted-foreground">
            {label}
            {lesson.description ? ` — ${lesson.description}` : ""}
            {!unlocked && !lesson.description
              ? " — complete the previous lesson to unlock"
              : ""}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {lesson.status === "draft" && <Badge variant="outline">Draft</Badge>}
        {scheduled && (
          <Badge variant="outline" className="flex items-center gap-1">
            <CalendarClock className="h-3 w-3" />
            {new Date(lesson.availableFrom!).toLocaleDateString(undefined, {
              day: "numeric",
              month: "short",
            })}
          </Badge>
        )}
        <Badge className={definition.tone} variant="secondary">
          {definition.label}
        </Badge>

        {canEdit && (
          <>
            {onPreview && (
              <Button
                variant="ghost"
                size="icon"
                title="Preview"
                onClick={(e) => {
                  e.stopPropagation()
                  onPreview()
                }}
              >
                <Eye className="h-4 w-4" />
                <span className="sr-only">Preview {lesson.title}</span>
              </Button>
            )}
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                title="Edit"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit()
                }}
              >
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Edit {lesson.title}</span>
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
