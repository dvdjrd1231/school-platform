"use client"

import { useEffect, useRef, useState } from "react"
import { Download } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { VideoPlayer } from "@/components/courses/video-player"
import type { NormalisedLesson } from "@/lib/lessons/normalise"

interface Props {
  lesson: NormalisedLesson
  /** Called when the watch requirement is met, for the watch-based rules. */
  onWatched?: () => void
}

/**
 * A video lesson: the player at the top, everything else beneath it.
 *
 * For an uploaded or direct-file video the progress bar is real — it is read
 * from the media element. Hosted embeds (YouTube, Vimeo) don't report progress
 * without loading their tracking SDKs, so those fall back to marking the
 * requirement met once the student opens the video, and the UI says so rather
 * than showing a bar that doesn't move.
 */
export function VideoLesson({ lesson, onWatched }: Props) {
  const video = lesson.video
  const containerRef = useRef<HTMLDivElement>(null)
  const [watchedPercent, setWatchedPercent] = useState(0)
  const notified = useRef(false)

  const rule = lesson.completion.rule
  const target = rule === "watch-percent" ? (lesson.completion.watchPercent ?? 80) : 100
  const tracksProgress = rule === "watch-percent" || rule === "watch-all"

  const url =
    video?.source === "upload"
      ? video.fileId
        ? `/api/files/${video.fileId}/download?inline=1`
        : ""
      : (video?.url ?? "")

  // Attach to the <video> element the player renders, when there is one.
  useEffect(() => {
    if (!tracksProgress || !onWatched) return
    const element = containerRef.current?.querySelector("video")
    if (!element) return

    const onTimeUpdate = () => {
      if (!element.duration || !Number.isFinite(element.duration)) return
      const percent = Math.min(100, Math.round((element.currentTime / element.duration) * 100))
      setWatchedPercent(percent)

      if (!notified.current && percent >= target) {
        notified.current = true
        onWatched()
      }
    }

    const onEnded = () => {
      setWatchedPercent(100)
      if (!notified.current) {
        notified.current = true
        onWatched()
      }
    }

    element.addEventListener("timeupdate", onTimeUpdate)
    element.addEventListener("ended", onEnded)
    return () => {
      element.removeEventListener("timeupdate", onTimeUpdate)
      element.removeEventListener("ended", onEnded)
    }
  }, [tracksProgress, onWatched, target, url])

  const isDirectFile = /\.(mp4|webm|ogg|ogv|mov|m4v)(\?|#|$)/i.test(url) || video?.source === "upload"

  return (
    <div className="space-y-6">
      <div ref={containerRef}>
        {url ? (
          <VideoPlayer url={url} title={lesson.title} />
        ) : (
          <div className="rounded-lg border border-dashed py-16 text-center text-muted-foreground">
            Your teacher hasn&apos;t added the video yet.
          </div>
        )}
      </div>

      {tracksProgress && url && (
        <div className="space-y-1">
          {isDirectFile ? (
            <>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Watched {watchedPercent}%
                  {rule === "watch-percent" ? ` of the ${target}% needed` : ""}
                </span>
                {watchedPercent >= target && <span className="text-green-600">Requirement met</span>}
              </div>
              <Progress value={watchedPercent} className="h-1.5" />
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              This video is hosted elsewhere, so we can&apos;t measure how much you&apos;ve watched
              — mark the lesson complete once you have finished it.
            </p>
          )}
        </div>
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
