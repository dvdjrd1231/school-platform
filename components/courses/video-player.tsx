"use client"

import { useState } from "react"
import { ExternalLink, Play } from "lucide-react"

import { youtubeEmbedUrl, youtubeThumbnail, youtubeVideoId, youtubeWatchUrl } from "@/lib/lessons/youtube"

interface Props {
  /** A YouTube link in any of its shapes, or a bare video id. */
  url: string
  title?: string
}

/**
 * Plays a lesson's YouTube video.
 *
 * Video lessons take YouTube links only, so this has one job and does it
 * properly: show the real thumbnail, and load the player only once the student
 * presses play. Deferring the iframe keeps YouTube's scripts and cookies off
 * the page for anyone who never watches, which is worth doing when the audience
 * is school children — and the embed uses youtube-nocookie for the same reason.
 */
export function VideoPlayer({ url, title }: Props) {
  const [playing, setPlaying] = useState(false)
  const videoId = youtubeVideoId(url)

  if (!videoId) {
    return (
      <div className="rounded-lg border bg-muted/40 p-6 text-sm">
        <p className="mb-2 text-muted-foreground">
          This doesn&apos;t look like a YouTube link, so it can&apos;t be played here.
        </p>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 font-medium text-emerald-600 underline"
        >
          <ExternalLink className="h-4 w-4" />
          Open the link in a new tab
        </a>
      </div>
    )
  }

  if (playing) {
    return (
      <iframe
        src={youtubeEmbedUrl(videoId, { autoplay: true })}
        title={title ?? "Lesson video"}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="aspect-video w-full rounded-lg border-0 bg-black"
      />
    )
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={`Play ${title ?? "video"}`}
      className="group relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-lg bg-black"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={youtubeThumbnail(videoId)}
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-60"
      />
      <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600 shadow-lg transition-transform group-hover:scale-110">
        <Play className="ml-1 h-8 w-8 text-white" fill="currentColor" />
      </span>
    </button>
  )
}

/** "Watch on YouTube" link, for when the embed is blocked on a network. */
export function YoutubeFallbackLink({ url }: { url: string }) {
  const videoId = youtubeVideoId(url)
  if (!videoId) return null

  return (
    <a
      href={youtubeWatchUrl(videoId)}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-emerald-600 hover:underline"
    >
      <ExternalLink className="h-3 w-3" />
      Watch on YouTube
    </a>
  )
}
