/**
 * File storage on top of MongoDB's GridFS.
 *
 * The platform runs as a self-hosted docker-compose stack with its own MongoDB
 * volume, so storing uploads there means no extra service to run, pay for, or
 * secure, and files are backed up by whatever already backs up the database.
 * If this ever outgrows GridFS, only this module has to change: everything else
 * goes through `saveFile`/`openDownloadStream`.
 */

import { Readable } from "node:stream"
import mongoose from "mongoose"

import { connectDB } from "@/lib/db/connect"
import { ApiError } from "@/lib/api/helpers"

const BUCKET = "uploads"

/** Refuse anything larger than this; the whole body is buffered in memory. */
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024

/**
 * Types we accept. Deliberately a whitelist, not a blacklist: an upload area is
 * exactly where an .html or .svg with script in it would end up being served
 * back to another signed-in user.
 */
const ALLOWED_PREFIXES = ["image/", "video/", "audio/"]
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

export function assertAllowedType(contentType: string): void {
  const type = contentType.split(";")[0].trim().toLowerCase()
  if (BLOCKED_EXACT.has(type)) {
    throw new ApiError(415, "SVG files aren't accepted. Please upload a PNG or JPEG instead.")
  }
  const ok = ALLOWED_EXACT.has(type) || ALLOWED_PREFIXES.some((p) => type.startsWith(p))
  if (!ok) throw new ApiError(415, `Files of type ${type || "unknown"} aren't accepted`)
}

async function bucket(): Promise<mongoose.mongo.GridFSBucket> {
  await connectDB()
  const db = mongoose.connection.db
  if (!db) throw new Error("Database connection is not ready")
  return new mongoose.mongo.GridFSBucket(db, { bucketName: BUCKET })
}

/** Write a file's bytes into GridFS and return its id. */
export async function saveFile(
  filename: string,
  contentType: string,
  data: Buffer,
): Promise<mongoose.Types.ObjectId> {
  const gfs = await bucket()

  return new Promise((resolve, reject) => {
    // The driver dropped the top-level contentType option; it goes in metadata
    // now. The authoritative copy is on the FileAsset record either way — this
    // is here so the GridFS entry is self-describing if inspected directly.
    const upload = gfs.openUploadStream(filename, { metadata: { contentType } })
    Readable.from(data)
      .pipe(upload)
      .on("error", reject)
      .on("finish", () => resolve(upload.id as mongoose.Types.ObjectId))
  })
}

/** A readable stream of a stored file, for streaming back to the browser. */
export async function openDownloadStream(
  id: mongoose.Types.ObjectId,
): Promise<NodeJS.ReadableStream> {
  const gfs = await bucket()
  return gfs.openDownloadStream(id)
}

/** Remove a stored file. Missing files are ignored — deletion is idempotent. */
export async function deleteFile(id: mongoose.Types.ObjectId): Promise<void> {
  const gfs = await bucket()
  try {
    await gfs.delete(id)
  } catch (err) {
    // GridFSBucket throws when the file is already gone; that's the desired
    // end state, so treat it as success rather than failing the request.
    const message = err instanceof Error ? err.message : ""
    if (!message.includes("File not found")) throw err
  }
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
