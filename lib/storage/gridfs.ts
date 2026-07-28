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
import { checkUploadType } from "@/lib/storage/upload-policy"

const BUCKET = "uploads"

// The allowlist itself lives in upload-policy.ts, free of any HTTP or auth
// import so it can be unit-tested on its own. This module only turns its
// verdict into the right HTTP error.
export { MAX_UPLOAD_BYTES, formatBytes } from "@/lib/storage/upload-policy"

/** Throw the appropriate ApiError when a file isn't acceptable. */
export function assertAllowedType(contentType: string, filename = ""): void {
  const verdict = checkUploadType(contentType, filename)
  if (!verdict.ok) throw new ApiError(verdict.status, verdict.message)
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

