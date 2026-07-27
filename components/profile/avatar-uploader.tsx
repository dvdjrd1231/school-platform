"use client"

import { useRef, useState } from "react"
import { Camera, Loader2, Trash2 } from "lucide-react"

import { apiMutate } from "@/lib/api/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

interface Props {
  userId: string
  name?: string
  /** Current avatar path, or empty. */
  avatar?: string
  onChange: (avatar: string) => void
  /** Set false to render read-only (viewing someone else's profile). */
  editable?: boolean
}

function initials(name?: string): string {
  if (!name) return "?"
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

/**
 * Profile photo: upload, replace, remove.
 *
 * The image goes through the same file storage as everything else (context
 * "avatar", visible school-wide since a profile picture is shown to whoever can
 * see the profile), and the user record keeps the path to it. Saving the path
 * rather than the bytes means an avatar is one small string on the user
 * document, and swapping storage later doesn't touch the user schema.
 */
export function AvatarUploader({ userId, name, avatar, onChange, editable = true }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  const upload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Choose an image file")
      return
    }
    // A profile photo has no business being large; this also keeps the
    // page-load cost of a roster of avatars sane.
    if (file.size > 5 * 1024 * 1024) {
      setError("Profile photos must be under 5 MB")
      return
    }

    setBusy(true)
    setError("")
    try {
      const body = new FormData()
      body.append("file", file)
      body.append(
        "meta",
        JSON.stringify({ context: "avatar", title: `${name ?? "user"} photo`, visibility: "school" }),
      )

      const res = await fetch("/api/files", { method: "POST", body })
      const payload = (await res.json().catch(() => ({}))) as { _id?: string; error?: string }
      if (!res.ok || !payload._id) throw new Error(payload.error ?? "Upload failed")

      const path = `/api/files/${payload._id}/download?inline=1`
      await apiMutate(`/api/users/${userId}`, "PATCH", { avatar: path })
      onChange(path)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload the photo")
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  const clear = async () => {
    setBusy(true)
    setError("")
    try {
      await apiMutate(`/api/users/${userId}`, "PATCH", { avatar: "" })
      onChange("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove the photo")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <Avatar className="h-24 w-24">
          {avatar && <AvatarImage src={avatar} alt={name ?? "Profile photo"} />}
          <AvatarFallback className="text-xl">{initials(name)}</AvatarFallback>
        </Avatar>

        {editable && (
          <>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void upload(file)
              }}
            />
            <Button
              size="icon"
              variant="secondary"
              className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
              <span className="sr-only">Change photo</span>
            </Button>
          </>
        )}
      </div>

      {editable && avatar && (
        <Button variant="ghost" size="sm" className="text-red-600" onClick={() => void clear()} disabled={busy}>
          <Trash2 className="mr-1 h-3.5 w-3.5" />
          Remove photo
        </Button>
      )}

      {error && <p className="text-center text-xs text-red-600">{error}</p>}
    </div>
  )
}
