import { FileAsset } from "@/lib/models"
import { ApiError, assertObjectId, handleErrors, hasRole, requireUser } from "@/lib/api/helpers"
import { canReadFile } from "@/lib/services/file-access"
import { openDownloadStream } from "@/lib/storage/gridfs"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

interface Params {
  params: Promise<{ id: string }>
}

/**
 * GET /api/files/:id/download[?inline=1]
 *
 * Streams the stored bytes. `inline=1` is the preview path — images, PDFs and
 * video render in the page; without it the browser downloads the file.
 *
 * Content-Disposition always carries a filename, and the type is echoed back
 * exactly as stored (uploads are whitelisted at that point), with nosniff so a
 * mislabelled file can't be reinterpreted as something executable.
 */
export async function GET(req: Request, { params }: Params) {
  try {
    const me = await requireUser()
    const { id } = await params
    assertObjectId(id, "file id")

    const file = await FileAsset.findById(id)
    if (!file) throw new ApiError(404, "File not found")
    if (!(await canReadFile(me, file))) throw new ApiError(403, "You can't view this file")

    // A YouTube item has no bytes here — the video is streamed from YouTube.
    // Redirecting would be worse than refusing: it would look like the platform
    // serves the file while silently handing the request to a third party.
    if (file.kind === "youtube" || !file.gridFsId) {
      throw new ApiError(409, "This is a YouTube video — watch it on the page rather than downloading")
    }

    const inline = new URL(req.url).searchParams.get("inline") === "1"

    // A view-only file can still be read in the browser, but not taken away.
    // Enforced here rather than by hiding the button: the download URL is
    // guessable, so a UI-only rule would be no rule at all. The owner and admins
    // are exempt — they have to be able to get their own material back.
    if (!file.allowDownload && !inline) {
      const isOwner = String(file.owner) === me.id
      if (!isOwner && !hasRole(me, "admin")) {
        throw new ApiError(403, "This item is available to read online, but not to download")
      }
    }

    const stream = await openDownloadStream(file.gridFsId)

    // Count real downloads, not previews, and don't make the response wait.
    if (!inline) {
      void FileAsset.updateOne({ _id: file._id }, { $inc: { downloads: 1 } }).catch(() => {})
    }

    // Quote-escape the filename so a name containing " can't break the header.
    const safeName = file.filename.replace(/"/g, "'")

    return new Response(stream as unknown as ReadableStream, {
      headers: {
        "Content-Type": file.contentType,
        "Content-Length": String(file.size),
        "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${safeName}"`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, max-age=3600",
      },
    })
  } catch (err) {
    return handleErrors(err)
  }
}
