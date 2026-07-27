import { FileAsset } from "@/lib/models"
import { ApiError, assertObjectId, handleErrors, requireUser } from "@/lib/api/helpers"
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

    const inline = new URL(req.url).searchParams.get("inline") === "1"
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
