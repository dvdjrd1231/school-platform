"use client"

import { useRef, useState } from "react"
import { Loader2, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

const SOURCE_PLACEHOLDER: Record<VideoDraft["source"], string> = {
  youtube: "https://www.youtube.com/watch?v=…",
  vimeo: "https://vimeo.com/…",
  mp4: "https://example.com/lesson.mp4",
  upload: "",
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return `${m}:${String(s).padStart(2, "0")}`
}

/**
 * Video lesson fields.
 *
 * No rich-text body and no submission settings — a video lesson is the player
 * plus what sits under it. The preview is live, so a teacher finds out here
 * whether their link actually plays rather than after publishing.
 */
export function VideoFields({ value, onChange, materials, onMaterialsChange, courseId }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const [uploadedName, setUploadedName] = useState("")

  const previewUrl =
    value.source === "upload"
      ? value.fileId
        ? `/api/files/${value.fileId}/download?inline=1`
        : ""
      : value.url.trim()

  const uploadVideo = async (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return

    setUploading(true)
    setUploadError("")
    try {
      const form = new FormData()
      form.append("file", file)
      form.append(
        "meta",
        JSON.stringify({
          context: "lesson",
          courseId: courseId || undefined,
          title: file.name,
          visibility: courseId ? "course" : "private",
        }),
      )

      const res = await fetch("/api/files", { method: "POST", body: form })
      const body = (await res.json().catch(() => ({}))) as { error?: string; _id?: string }
      if (!res.ok) throw new Error(body.error ?? `Upload failed (${res.status})`)

      setUploadedName(file.name)
      onChange({ fileId: body._id, url: "" })

      // Read the real duration from the file so the teacher doesn't have to
      // guess it. Fails quietly — it's a convenience, not a requirement.
      const probe = document.createElement("video")
      probe.preload = "metadata"
      probe.onloadedmetadata = () => {
        if (Number.isFinite(probe.duration)) {
          onChange({ durationSeconds: String(Math.round(probe.duration)) })
        }
        URL.revokeObjectURL(probe.src)
      }
      probe.src = URL.createObjectURL(file)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Video source</Label>
          <Select
            value={value.source}
            onValueChange={(source) =>
              // Clearing the other half stops an uploaded file and a pasted link
              // both being set, where only one of them is the real video.
              onChange({
                source: source as VideoDraft["source"],
                ...(source === "upload" ? { url: "" } : { fileId: "" }),
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="youtube">YouTube</SelectItem>
              <SelectItem value="vimeo">Vimeo</SelectItem>
              <SelectItem value="mp4">Direct MP4 link</SelectItem>
              <SelectItem value="upload">Upload a video</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="video-duration">Duration</Label>
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
              ? `${formatDuration(Number(value.durationSeconds))} — detected automatically where possible.`
              : "Detected automatically for uploads; enter it manually for links."}
          </p>
        </div>
      </div>

      {value.source === "upload" ? (
        <div className="space-y-2">
          <Label>Video file</Label>
          <input
            ref={inputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => void uploadVideo(e.target.files)}
          />
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              {value.fileId ? "Replace video" : "Upload video"}
            </Button>
            {value.fileId && (
              <span className="truncate text-sm text-muted-foreground">
                {uploadedName || "Video uploaded"}
              </span>
            )}
          </div>
          {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="video-url">Video link</Label>
          <Input
            id="video-url"
            value={value.url}
            onChange={(e) => onChange({ url: e.target.value })}
            placeholder={SOURCE_PLACEHOLDER[value.source]}
          />
        </div>
      )}

      {previewUrl && (
        <div className="space-y-2">
          <Label>Preview</Label>
          <VideoPlayer url={previewUrl} title="Lesson video preview" />
        </div>
      )}

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
