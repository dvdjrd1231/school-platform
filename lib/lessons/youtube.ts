/**
 * Reading a YouTube video id out of whatever a teacher pasted.
 *
 * Video lessons take YouTube links only. Accepting one source means one player,
 * one preview, and no uploaded video files sitting in the database — but it
 * only works if every shape of YouTube link is understood, because teachers
 * paste whatever the address bar or the Share button gave them.
 *
 * Shared by the client (validation, preview) and the server (validation), so
 * this module stays free of both.
 */

/** A YouTube id is 11 characters of URL-safe base64. */
const ID_PATTERN = /^[\w-]{11}$/

const HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
  "www.youtu.be",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
])

/**
 * Extract the video id, or null if this isn't a YouTube link we recognise.
 *
 * Handles: watch?v=, youtu.be/, /embed/, /shorts/, /live/, /v/, and a bare id.
 */
export function youtubeVideoId(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  // A bare id, which is what someone pastes from a previous lesson.
  if (ID_PATTERN.test(trimmed)) return trimmed

  let url: URL
  try {
    // Tolerate a missing scheme — "youtu.be/abc" is a normal thing to paste.
    url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`)
  } catch {
    return null
  }

  if (!HOSTS.has(url.hostname.toLowerCase())) return null

  // youtu.be/<id>
  if (url.hostname.toLowerCase().endsWith("youtu.be")) {
    const id = url.pathname.split("/").filter(Boolean)[0]
    return id && ID_PATTERN.test(id) ? id : null
  }

  // youtube.com/watch?v=<id>
  const queryId = url.searchParams.get("v")
  if (queryId && ID_PATTERN.test(queryId)) return queryId

  // youtube.com/{embed,shorts,live,v}/<id>
  const match = url.pathname.match(/\/(?:embed|shorts|live|v)\/([\w-]{11})/)
  if (match) return match[1]

  return null
}

export function isYoutubeUrl(input: string): boolean {
  return youtubeVideoId(input) !== null
}

/**
 * The embed URL for a video id.
 *
 * youtube-nocookie.com is deliberate: it stops YouTube setting tracking cookies
 * on students until they actually play something, which matters when the
 * audience is children.
 */
export function youtubeEmbedUrl(id: string, { autoplay = false } = {}): string {
  const params = new URLSearchParams({ rel: "0", modestbranding: "1" })
  if (autoplay) params.set("autoplay", "1")
  return `https://www.youtube-nocookie.com/embed/${id}?${params}`
}

/** Thumbnail for a video id, used for the preview before playing. */
export function youtubeThumbnail(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
}

/** Canonical watch link, for "open on YouTube". */
export function youtubeWatchUrl(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`
}
