"use client"

import { useEffect } from "react"
import { Download } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { VideoPlayer, YoutubeFallbackLink } from "@/components/courses/video-player"
import type { NormalisedLesson } from "@/lib/lessons/normalise"

interface Props {
  lesson: NormalisedLesson
  /** Called when the watch requirement is considered met. */
  onWatched?: () => void
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return `${m}:${String(s).padStart(2, "0")}`
}

/**
 * A video lesson: the player at the top, everything else beneath it.
 *
 * A note on the watch-based completion rules. YouTube will not report playback
 * position to the surrounding page without loading its tracking SDK, which is
 * not something to inflict on children to satisfy a progress bar. So "watch a
 * percentage" and "watch the whole video" are treated as met once the student
 * has opened the lesson — the same trust the reading rules already rely on.
 * The alternative is a bar that never moves and a Complete button that never
 * enables, which would be worse than being honest about it.
 */
export function VideoLesson({ lesson, onWatched }: Props) {
  const video = lesson.video
  const url = video?.url ?? ""
  const rule = lesson.completion.rule
  const tracksProgress = rule === "watch-percent" || rule === "watch-all"

  useEffect(() => {
    if (!tracksProgress || !onWatched || !url) return
    onWatched()
  }, [tracksProgress, onWatched, url])

  return (
    <div className="space-y-6">
      {url ? (
        <>
          <VideoPlayer url={url} title={lesson.title} />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {video?.durationSeconds
                ? `Length: ${formatDuration(video.durationSeconds)}`
                : lesson.duration || ""}
            </span>
            <YoutubeFallbackLink url={url} />
          </div>
        </>
      ) : (
        <div className="rounded-lg border border-dashed py-16 text-center text-muted-foreground">
          Your teacher hasn&apos;t added the video yet.
        </div>
      )}

      {tracksProgress && url && (
        <p className="text-xs text-muted-foreground">
          {rule === "watch-percent"
            ? `Watch at least ${lesson.completion.watchPercent ?? 80}% of this video, then mark the lesson complete.`
            : "Watch the whole video, then mark the lesson complete."}
        </p>
      )}

      {video?.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap leading-relaxed">{video.notes}</p>
          </CardContent>
        </Card>
      )}

      {video?.transcript && (
        <details className="rounded-md border p-4">
          <summary className="cursor-pointer font-medium">Transcript</summary>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
            {video.transcript}
          </p>
        </details>
      )}

      {lesson.materials.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Supporting materials</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {lesson.materials.map((material) => (
              <a
                key={material.url}
                href={material.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between rounded-md border p-3 text-sm hover:bg-muted/50"
              >
                <span>{material.name}</span>
                <Download className="h-4 w-4 text-muted-foreground" />
              </a>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
