"use client"

import {
  BookOpen,
  ClipboardList,
  HelpCircle,
  MousePointerClick,
  PlayCircle,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { LESSON_TYPE_DEFINITIONS, type LessonType } from "@/lib/lessons/types"

const ICONS: Record<string, LucideIcon> = {
  BookOpen,
  PlayCircle,
  MousePointerClick,
  HelpCircle,
  ClipboardList,
}

/**
 * The icon for a lesson type.
 *
 * Resolved from the shared registry rather than chosen per screen, so a video
 * lesson looks the same in the module list, the sidebar and the lesson manager.
 */
export function LessonTypeIcon({
  type,
  className,
}: {
  type: LessonType
  className?: string
}) {
  const Icon = ICONS[LESSON_TYPE_DEFINITIONS[type].icon] ?? BookOpen
  return <Icon className={cn("h-4 w-4", className)} />
}

/** Icon in a tinted round badge — the module list's leading marker. */
export function LessonTypeBadge({ type, className }: { type: LessonType; className?: string }) {
  const definition = LESSON_TYPE_DEFINITIONS[type]

  return (
    <span
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
        definition.tone,
        className,
      )}
      title={definition.label}
    >
      <LessonTypeIcon type={type} />
    </span>
  )
}
