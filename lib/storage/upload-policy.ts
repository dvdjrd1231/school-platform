/**
 * What may be uploaded.
 *
 * Deliberately free of any HTTP or auth import: this is a policy decision about
 * bytes, and keeping it separate means it can be unit-tested without dragging
 * in the auth stack. `gridfs.ts` translates the result into an ApiError.
 */

/** Refuse anything larger than this; the whole body is buffered in memory. */
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024

/**
 * Types we accept. Deliberately a whitelist, not a blacklist: an upload area is
 * exactly where an .html or .svg with script in it would end up being served
 * back to another signed-in user.
 */
const ALLOWED_PREFIXES = ["image/", "audio/"]

const ALLOWED_EXACT = new Set([
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/zip",
])

// SVG is an image but can carry script, so it's excluded from the image prefix.
const BLOCKED_EXACT = new Set(["image/svg+xml"])

/**
 * Video is deliberately not uploadable.
 *
 * Videos are added as YouTube links instead, so the hosting, transcoding and
 * bandwidth are YouTube's rather than this server's — a single lesson video
 * would otherwise be hundreds of megabytes inside the database, served to every
 * student from one VPS with no adaptive bitrate.
 *
 * Matched on the extension as well as the MIME type: browsers report video
 * types inconsistently, and a .mov commonly arrives as
 * application/octet-stream, which would sail past a type-only check.
 */
const VIDEO_EXTENSIONS = [
  ".mp4",
  ".m4v",
  ".mov",
  ".webm",
  ".avi",
  ".mkv",
  ".wmv",
  ".flv",
  ".mpg",
  ".mpeg",
  ".3gp",
  ".ogv",
]

export const NO_VIDEO_UPLOADS =
  "Videos aren't uploaded to this site. Add the video to YouTube and paste its link instead — " +
  "YouTube handles the hosting and streaming."

export type UploadVerdict = { ok: true } | { ok: false; status: number; message: string }

/** Would this file be accepted? */
export function checkUploadType(contentType: string, filename = ""): UploadVerdict {
  const type = contentType.split(";")[0].trim().toLowerCase()
  const name = filename.toLowerCase()

  if (type.startsWith("video/") || VIDEO_EXTENSIONS.some((ext) => name.endsWith(ext))) {
    return { ok: false, status: 415, message: NO_VIDEO_UPLOADS }
  }

  if (BLOCKED_EXACT.has(type)) {
    return {
      ok: false,
      status: 415,
      message: "SVG files aren't accepted. Please upload a PNG or JPEG instead.",
    }
  }

  const allowed = ALLOWED_EXACT.has(type) || ALLOWED_PREFIXES.some((p) => type.startsWith(p))
  if (!allowed) {
    return { ok: false, status: 415, message: `Files of type ${type || "unknown"} aren't accepted` }
  }

  return { ok: true }
}

/** Human-readable size, used in the file lists. */
export function formatBytes(bytes: number): string {
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
