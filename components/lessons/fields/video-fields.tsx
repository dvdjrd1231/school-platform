"use client"

import { AlertCircle, CheckCircle2 } from "lucide-react"

import { youtubeVideoId } from "@/lib/media/youtube"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { VideoPlayer } from "@/components/courses/video-player"
import { MaterialsField } from "@/components/lessons/fields/materials-field"
import type { MaterialDraft, VideoDraft } from "@/components/lessons/drafts"

interface Props {
  value: VideoDraft
  onChange: (patch: Partial<VideoDraft>) => void
  materials: MaterialDraft[]
  onMaterialsChange: (materials: MaterialDraft[]) => void
  courseId: string
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return `${m}:${String(s).padStart(2, "0")}`
}

/**
 * Video lesson fields.
 *
 * YouTube links only. The link is checked as it is typed and previewed with the
 * real player, so a teacher finds out here whether the video works — rather
 * than a student finding out later that the lesson is an empty black box.
 */
export function VideoFields({ value, onChange, materials, onMaterialsChange, courseId }: Props) {
  const trimmed = value.url.trim()
  const videoId = youtubeVideoId(trimmed)
  const invalid = trimmed.length > 0 && !videoId

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="video-url">YouTube link</Label>
        <Input
          id="video-url"
          value={value.url}
          onChange={(e) => onChange({ url: e.target.value })}
          placeholder="https://www.youtube.com/watch?v=…"
          aria-invalid={invalid}
          aria-describedby="video-url-help"
        />
        <p id="video-url-help" className="flex items-center gap-1 text-xs">
          {invalid ? (
            <span className="flex items-center gap-1 text-red-600">
              <AlertCircle className="h-3 w-3" />
              That isn&apos;t a YouTube link. Paste the address from the video&apos;s page or its
              Share button.
            </span>
          ) : videoId ? (
            <span className="flex items-center gap-1 text-green-600">
              <CheckCircle2 className="h-3 w-3" />
              Link recognised — check the preview below.
            </span>
          ) : (
            <span className="text-muted-foreground">
              Video lessons take YouTube links. Watch, share, embed and Shorts links all work.
            </span>
          )}
        </p>
      </div>

      {videoId && (
        <div className="space-y-2">
          <Label>Preview</Label>
          <VideoPlayer url={trimmed} title="Lesson video preview" />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="video-duration">Video duration (optional)</Label>
        <Input
          id="video-duration"
          type="number"
          min={0}
          value={value.durationSeconds}
          onChange={(e) => onChange({ durationSeconds: e.target.value })}
          placeholder="Seconds"
        />
        <p className="text-xs text-muted-foreground">
          {value.durationSeconds
            ? `${formatDuration(Number(value.durationSeconds))} — shown to students before they start.`
            : "YouTube doesn't tell us the length without loading its tracking scripts, so enter it here if you want it shown."}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="video-notes">Instructions or notes</Label>
        <Textarea
          id="video-notes"
          rows={4}
          value={value.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          placeholder="What students should look out for, or do after watching."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="video-transcript">Transcript or captions (optional)</Label>
        <Textarea
          id="video-transcript"
          rows={4}
          value={value.transcript}
          onChange={(e) => onChange({ transcript: e.target.value })}
          placeholder="Paste the transcript so the lesson is usable without sound."
        />
      </div>

      <MaterialsField
        label="Supporting attachments (optional)"
        hint="Slides, worksheets, or anything else that goes with the video."
        courseId={courseId}
        materials={materials}
        onChange={onMaterialsChange}
      />
    </div>
  )
}
