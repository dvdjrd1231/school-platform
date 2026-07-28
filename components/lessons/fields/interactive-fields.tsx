"use client"

import { useRef, useState } from "react"
import { ExternalLink, Loader2, Upload } from "lucide-react"

import { BUILTIN_ACTIVITIES, BUILTIN_ACTIVITY_LABELS } from "@/lib/lessons/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { InteractiveDraft } from "@/components/lessons/drafts"

interface Props {
  value: InteractiveDraft
  onChange: (patch: Partial<InteractiveDraft>) => void
  courseId: string
  /** Set when the completion rule needs a score, so the field is required. */
  scoreRequired: boolean
}

/**
 * Interactive lesson fields.
 *
 * No video link unless the activity itself is an embed, no file-submission
 * settings, and no reading editor as the main field — the activity is the
 * lesson. Instructions are a supporting field, not the content.
 */
export function InteractiveFields({ value, onChange, courseId, scoreRequired }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const [uploadedName, setUploadedName] = useState("")

  const uploadPackage = async (files: FileList | null) => {
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
      onChange({ fileId: body._id })
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>How is the activity delivered?</Label>
        <Select
          value={value.method}
          onValueChange={(method) =>
            onChange({
              method: method as InteractiveDraft["method"],
              // Only one delivery route can be live at a time.
              ...(method === "upload" || method === "builtin" ? { url: "" } : { fileId: "" }),
              ...(method === "builtin" ? {} : { builtinActivity: "" }),
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="link">External activity link</SelectItem>
            <SelectItem value="embed">Embedded activity</SelectItem>
            <SelectItem value="upload">Uploaded interactive package</SelectItem>
            <SelectItem value="builtin">Built here on the website</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {(value.method === "link" || value.method === "embed") && (
        <div className="space-y-2">
          <Label htmlFor="activity-url">
            {value.method === "embed" ? "Embed URL" : "Activity URL"}
          </Label>
          <Input
            id="activity-url"
            value={value.url}
            onChange={(e) => onChange({ url: e.target.value })}
            placeholder="https://…"
          />
          <p className="text-xs text-muted-foreground">
            {value.method === "embed"
              ? "Opens inside the lesson page. The activity's site must allow embedding."
              : "Opens in a clearly labelled activity window."}
          </p>
        </div>
      )}

      {value.method === "upload" && (
        <div className="space-y-2">
          <Label>Activity package</Label>
          <input
            ref={inputRef}
            type="file"
            accept=".zip,application/zip"
            className="hidden"
            onChange={(e) => void uploadPackage(e.target.files)}
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
              {value.fileId ? "Replace package" : "Upload package"}
            </Button>
            {value.fileId && (
              <span className="truncate text-sm text-muted-foreground">
                {uploadedName || "Package uploaded"}
              </span>
            )}
          </div>
          {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}
        </div>
      )}

      {value.method === "builtin" && (
        <div className="space-y-2">
          <Label>Activity type</Label>
          <Select
            value={value.builtinActivity || undefined}
            onValueChange={(builtinActivity) => onChange({ builtinActivity })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose an activity" />
            </SelectTrigger>
            <SelectContent>
              {BUILTIN_ACTIVITIES.map((activity) => (
                <SelectItem key={activity} value={activity}>
                  {BUILTIN_ACTIVITY_LABELS[activity]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Matching, sequencing, fill-in-the-blank and multiple-choice activities are built with
            the question builder — add them as practice problems on this lesson once it is saved.
          </p>
        </div>
      )}

      {value.method === "embed" && value.url.trim() && (
        <div className="space-y-2">
          <Label>Preview</Label>
          <iframe
            src={value.url.trim()}
            title="Activity preview"
            className="h-72 w-full rounded-md border"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        </div>
      )}

      {value.method === "link" && value.url.trim() && (
        <a
          href={value.url.trim()}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-sm text-emerald-600 underline"
        >
          <ExternalLink className="h-4 w-4" />
          Open the activity to check the link
        </a>
      )}

      <div className="space-y-2">
        <Label htmlFor="activity-instructions">Student instructions</Label>
        <Textarea
          id="activity-instructions"
          rows={4}
          value={value.instructions}
          onChange={(e) => onChange({ instructions: e.target.value })}
          placeholder="What students should do in the activity."
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="activity-score">
            Passing score {scoreRequired ? "" : "(optional)"}
          </Label>
          <Input
            id="activity-score"
            type="number"
            min={0}
            max={100}
            value={value.passingScore}
            onChange={(e) => onChange({ passingScore: e.target.value })}
            placeholder="e.g. 70"
          />
          <p className="text-xs text-muted-foreground">Percentage. Leave blank when unscored.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="activity-attempts">Attempts</Label>
          <Input
            id="activity-attempts"
            type="number"
            min={0}
            value={value.attempts}
            onChange={(e) => onChange({ attempts: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">0 means unlimited.</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="activity-feedback">Feedback shown afterwards (optional)</Label>
        <Textarea
          id="activity-feedback"
          rows={2}
          value={value.feedback}
          onChange={(e) => onChange({ feedback: e.target.value })}
        />
      </div>
    </div>
  )
}
