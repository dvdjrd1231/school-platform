/**
 * Turning a teacher's submission settings into rules the server can enforce.
 *
 * The upload form uses these to set `accept` and to warn early, but the check
 * that counts is the server one — an `accept` attribute is a hint to the file
 * picker, not a restriction.
 */

import type { FileTypeGroup, SubmissionType } from "@/lib/models/Assignment"

interface GroupSpec {
  label: string
  extensions: string[]
  /** MIME types, or prefixes ending in `/`. */
  mime: string[]
}

export const FILE_TYPE_SPECS: Record<FileTypeGroup, GroupSpec> = {
  pdf: { label: "PDF", extensions: [".pdf"], mime: ["application/pdf"] },
  doc: {
    label: "Word document",
    extensions: [".doc", ".docx"],
    mime: [
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
  },
  slides: {
    label: "PowerPoint",
    extensions: [".ppt", ".pptx"],
    mime: [
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ],
  },
  sheet: {
    label: "Spreadsheet",
    extensions: [".xls", ".xlsx", ".csv"],
    mime: [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv",
    ],
  },
  image: { label: "Image", extensions: [".jpg", ".jpeg", ".png", ".gif", ".webp"], mime: ["image/"] },
  video: { label: "Video", extensions: [".mp4", ".webm", ".mov"], mime: ["video/"] },
  audio: { label: "Audio", extensions: [".mp3", ".m4a", ".wav", ".ogg"], mime: ["audio/"] },
  zip: { label: "Zip archive", extensions: [".zip"], mime: ["application/zip"] },
}

/** The `accept` attribute for a file input, or undefined for "anything". */
export function acceptAttribute(groups: FileTypeGroup[]): string | undefined {
  if (groups.length === 0) return undefined
  return groups.flatMap((g) => FILE_TYPE_SPECS[g].extensions).join(",")
}

/** Human list of what's allowed, for the hint under the upload button. */
export function describeAllowedTypes(groups: FileTypeGroup[]): string {
  if (groups.length === 0) return "Any file type"
  return groups.map((g) => FILE_TYPE_SPECS[g].label).join(", ")
}

/**
 * Does this file match one of the allowed groups?
 *
 * Both the MIME type and the extension are checked, and either matching is
 * enough: browsers report MIME inconsistently across platforms (a .docx often
 * arrives as application/octet-stream), so requiring both would reject valid
 * work. An empty group list means the teacher allowed anything.
 */
export function isFileTypeAllowed(
  groups: FileTypeGroup[],
  filename: string,
  contentType: string,
): boolean {
  if (groups.length === 0) return true

  const lowerName = filename.toLowerCase()
  const lowerType = contentType.split(";")[0].trim().toLowerCase()

  return groups.some((group) => {
    const spec = FILE_TYPE_SPECS[group]
    if (spec.extensions.some((ext) => lowerName.endsWith(ext))) return true
    return spec.mime.some((m) => (m.endsWith("/") ? lowerType.startsWith(m) : lowerType === m))
  })
}

/** Does this submission type accept uploaded files at all? */
export function acceptsFiles(type: SubmissionType): boolean {
  return type === "file" || type === "image" || type === "media"
}

/** Does this submission type accept typed text? */
export function acceptsText(type: SubmissionType): boolean {
  return type === "text"
}

/** Does this submission type accept a URL? */
export function acceptsLink(type: SubmissionType): boolean {
  return type === "link"
}

export const SUBMISSION_TYPE_LABELS: Record<SubmissionType, string> = {
  file: "File upload",
  text: "Text entry",
  link: "Website link",
  image: "Image upload",
  media: "Video or audio upload",
  none: "No online submission",
}

/**
 * The file groups that make sense for a submission type. An image-upload
 * assignment shouldn't offer "Zip archive" in its allowed-types list.
 */
export function defaultGroupsFor(type: SubmissionType): FileTypeGroup[] {
  if (type === "image") return ["image"]
  if (type === "media") return ["video", "audio"]
  return []
}
