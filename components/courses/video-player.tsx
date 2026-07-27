"use client"

import { useState } from "react"
import { Play } from "lucide-react"

/**
 * Turn a link a teacher pasted into something the browser can actually play.
 *
 * Teachers paste whatever the address bar showed — a YouTube watch link, a
 * youtu.be short link, a Vimeo page, or a direct file. Only the last of those
 * works in a <video> tag, so the first three are mapped to their embed form.
 * Returns null when the link isn't recognised, and the caller shows a plain link.
 */
export function toEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.replace(/^www\./, "")

    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = parsed.searchParams.get("v")
      if (id) return `https://www.youtube.com/embed/${id}`
      // Already an /embed/ or /shorts/ link.
      const match = parsed.pathname.match(/\/(?:embed|shorts)\/([\w-]+)/)
      if (match) return `https://www.youtube.com/embed/${match[1]}`
    }
    if (host === "youtu.be") {
      const id = parsed.pathname.slice(1)
      if (id) return `https://www.youtube.com/embed/${id}`
    }
    if (host === "vimeo.com") {
      const id = parsed.pathname.split("/").filter(Boolean)[0]
      if (id && /^\d+$/.test(id)) return `https://player.vimeo.com/video/${id}`
    }
    if (host === "player.vimeo.com" || host === "youtube-nocookie.com") return url
  } catch {
    return null
  }
  return null
}

/** True for links that point straight at a video file the browser can decode. */
function isDirectVideo(url: string): boolean {
  return /\.(mp4|webm|ogg|ogv|mov|m4v)(\?|#|$)/i.test(url)
}

interface Props {
  url: string
  title?: string
}

/**
 * Plays a lesson's video.
 *
 * The old page had a Play button that did nothing because there was no player
 * behind it. Direct files get a real <video> element with controls; hosted
 * services get their embed iframe, loaded only after the user clicks so the
 * page doesn't pull in a third-party player on every lesson view.
 */
export function VideoPlayer({ url, title }: Props) {
  const [started, setStarted] = useState(false)
  const embed = toEmbedUrl(url)

  if (isDirectVideo(url)) {
    return (
      <video
        controls
        preload="metadata"
        className="aspect-video w-full rounded-lg bg-black"
        src={url}
      >
        Your browser can&apos;t play this video.{" "}
        <a href={url} className="underline">
          Download it instead
        </a>
        .
      </video>
    )
  }

  if (!embed) {
    return (
      <div className="rounded-lg border bg-muted/40 p-6 text-sm">
        <p className="mb-2 text-muted-foreground">
          This video is hosted somewhere we can&apos;t embed.
        </p>
        <a href={url} target="_blank" rel="noreferrer" className="font-medium text-emerald-600 underline">
          Open the video in a new tab
        </a>
      </div>
    )
  }

  if (!started) {
    return (
      <button
        type="button"
        onClick={() => setStarted(true)}
        className="group relative flex aspect-video w-full items-center justify-center rounded-lg bg-black/90 transition-colors hover:bg-black"
      >
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600 transition-transform group-hover:scale-110">
          <Play className="ml-1 h-8 w-8 text-white" fill="currentColor" />
        </span>
        <span className="sr-only">Play {title ?? "video"}</span>
      </button>
    )
  }

  return (
    <iframe
      src={`${embed}${embed.includes("?") ? "&" : "?"}autoplay=1`}
      title={title ?? "Lesson video"}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      className="aspect-video w-full rounded-lg border-0 bg-black"
    />
  )
}
