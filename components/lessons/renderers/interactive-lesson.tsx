"use client"

import { useState } from "react"
import { Download, ExternalLink, Maximize2, Trophy } from "lucide-react"

import { BUILTIN_ACTIVITY_LABELS, type BuiltinActivity } from "@/lib/lessons/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { NormalisedLesson } from "@/lib/lessons/normalise"

interface Props {
  lesson: NormalisedLesson
  /** Called when the student opens the activity, for the `open` rule. */
  onOpened?: () => void
}

/**
 * An interactive lesson: the activity itself, with instructions and status.
 *
 * Embeds run in a sandboxed frame. Third-party activity pages are not trusted
 * with the surrounding session, so the sandbox withholds same-origin access —
 * an embedded activity cannot read this page or its cookies.
 */
export function InteractiveLesson({ lesson, onOpened }: Props) {
  const activity = lesson.interactive
  const [opened, setOpened] = useState(false)

  const markOpened = () => {
    if (!opened) {
      setOpened(true)
      onOpened?.()
    }
  }

  const attempts = activity?.attempts ?? 0

  return (
    <div className="space-y-6">
      {activity?.instructions && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">What to do</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap leading-relaxed">{activity.instructions}</p>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-2 text-sm">
        {activity?.passingScore != null && (
          <Badge variant="outline" className="flex items-center gap-1">
            <Trophy className="h-3 w-3" />
            Pass mark {activity.passingScore}%
          </Badge>
        )}
        <Badge variant="outline">
          {attempts === 0 ? "Unlimited attempts" : `${attempts} attempt${attempts === 1 ? "" : "s"}`}
        </Badge>
        {lesson.duration && <Badge variant="outline">{lesson.duration}</Badge>}
      </div>

      {activity?.method === "embed" && activity.url && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Activity</p>
            <Button variant="ghost" size="sm" asChild onClick={markOpened}>
              <a href={activity.url} target="_blank" rel="noreferrer">
                <Maximize2 className="mr-2 h-4 w-4" />
                Open full screen
              </a>
            </Button>
          </div>
          <iframe
            src={activity.url}
            title={`${lesson.title} activity`}
            onLoad={markOpened}
            className="h-[32rem] w-full rounded-lg border"
            // No allow-same-origin: the activity is third-party content and must
            // not be able to reach this page's session.
            sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
          />
        </div>
      )}

      {activity?.method === "link" && activity.url && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              This activity opens in its own window.
            </p>
            <Button asChild onClick={markOpened}>
              <a href={activity.url} target="_blank" rel="noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Start the activity
              </a>
            </Button>
            {opened && (
              <p className="text-xs text-muted-foreground">
                Come back here when you&apos;ve finished.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {activity?.method === "upload" && activity.fileId && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              Download the activity package to run it.
            </p>
            <Button asChild onClick={markOpened}>
              <a href={`/api/files/${activity.fileId}/download`}>
                <Download className="mr-2 h-4 w-4" />
                Download activity
              </a>
            </Button>
          </CardContent>
        </Card>
      )}

      {activity?.method === "builtin" && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="font-medium">
              {BUILTIN_ACTIVITY_LABELS[activity.builtinActivity as BuiltinActivity] ?? "Activity"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Work through the practice problems below to complete this activity.
            </p>
          </CardContent>
        </Card>
      )}

      {!activity?.url && !activity?.fileId && activity?.method !== "builtin" && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Your teacher hasn&apos;t set up the activity yet.
          </CardContent>
        </Card>
      )}

      {activity?.feedback && opened && (
        <div className="rounded-md border-l-4 border-emerald-500 bg-emerald-50 p-4 text-sm text-emerald-900">
          {activity.feedback}
        </div>
      )}
    </div>
  )
}
