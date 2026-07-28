"use client"

import { useRef, useState } from "react"
import { FileText, Loader2, Paperclip, Trash2, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import type { MaterialDraft } from "@/components/lessons/drafts"

interface Props {
  label: string
  hint?: string
  courseId: string
  materials: MaterialDraft[]
  onChange: (materials: MaterialDraft[]) => void
}

function formatBytes(bytes?: number): string {
  if (!bytes) return ""
  if (bytes < 1024) return `${bytes} B`
  const units = ["KB", "MB", "GB"]
  let value = bytes / 1024
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit++
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unit]}`
}

/**
 * Attach files to a lesson.
 *
 * Uploads go through the same storage as everything else, filed under the
 * `lesson` context and shared with the class, so students can open them without
 * a separate permission grant.
 */
export function MaterialsField({ label, hint, courseId, materials, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")

  const upload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    setError("")

    try {
      const added: MaterialDraft[] = []

      for (const file of Array.from(files)) {
        const form = new FormData()
        form.append("file", file)
        form.append(
          "meta",
          JSON.stringify({
            context: "lesson",
            courseId: courseId || undefined,
            title: file.name,
            // Class-visible so enrolled students can open it. Without a course
            // it stays private, which is the safe fallback.
            visibility: courseId ? "course" : "private",
          }),
        )

        const res = await fetch("/api/files", { method: "POST", body: form })
        const body = (await res.json().catch(() => ({}))) as { error?: string; _id?: string }
        if (!res.ok) throw new Error(body.error ?? `Upload failed (${res.status})`)

        added.push({
          name: file.name,
          url: `/api/files/${body._id}/download`,
          size: file.size,
          fileId: body._id,
        })
      }

      onChange([...materials, ...added])
      if (inputRef.current) inputRef.current.value = ""
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}

      {materials.length > 0 && (
        <ul className="space-y-1">
          {materials.map((material, index) => (
            <li
              key={`${material.url}-${index}`}
              className="flex items-center justify-between gap-2 rounded-md border p-2 text-sm"
            >
              <span className="flex min-w-0 items-center gap-2">
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{material.name}</span>
                {material.size ? (
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatBytes(material.size)}
                  </span>
                ) : null}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-red-600"
                onClick={() => onChange(materials.filter((_, i) => i !== index))}
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Remove {material.name}</span>
              </Button>
            </li>
          ))}
        </ul>
      )}

      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => void upload(e.target.files)}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : materials.length > 0 ? (
          <Paperclip className="mr-2 h-4 w-4" />
        ) : (
          <Upload className="mr-2 h-4 w-4" />
        )}
        {uploading ? "Uploading…" : materials.length > 0 ? "Add another file" : "Upload a file"}
      </Button>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
