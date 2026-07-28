/**
 * Find — and optionally remove — video files uploaded before videos moved to
 * YouTube links.
 *
 * New uploads of video are refused, but anything already stored is still in
 * GridFS taking up disk inside the database volume. A handful of lesson videos
 * is easily several gigabytes.
 *
 * Report only:
 *   docker compose exec -T mongo mongosh \
 *     -u "$MONGO_ROOT_USER" -p "$MONGO_ROOT_PASSWORD" --authenticationDatabase admin \
 *     school-platform --quiet --file /scripts/remove-uploaded-videos.mongo.js
 *
 * Remove (take a backup first):
 *   docker compose exec -T -e FIX=true mongo mongosh ... --file /scripts/remove-uploaded-videos.mongo.js
 *
 * Nothing on YouTube is touched — this only removes bytes stored on this server.
 */

const fix = (process.env.FIX || "").toLowerCase() === "true"

// Matches the server-side rule in lib/storage/upload-policy.ts.
const VIDEO_EXTENSIONS = /\.(mp4|m4v|mov|webm|avi|mkv|wmv|flv|mpg|mpeg|3gp|ogv)$/i

function isVideo(asset) {
  if (asset.kind === "youtube") return false // a link, not stored bytes
  if ((asset.contentType || "").startsWith("video/")) return true
  return VIDEO_EXTENSIONS.test(asset.filename || "")
}

const assets = db.fileassets.find({}, { filename: 1, contentType: 1, size: 1, kind: 1, gridFsId: 1 }).toArray()
const videos = assets.filter(isVideo)

print(`Database: ${db.getName()}`)
print(`${assets.length} stored item(s), of which ${videos.length} are uploaded video\n`)

if (videos.length === 0) {
  print("Nothing to do — no uploaded video files remain.")
} else {
  let bytes = 0
  videos.forEach((v) => {
    bytes += v.size || 0
    const mb = ((v.size || 0) / 1024 / 1024).toFixed(1)
    print(`  ${String(mb).padStart(8)} MB  ${v.filename}`)
  })

  const totalMb = (bytes / 1024 / 1024).toFixed(1)

  if (!fix) {
    print(
      `\n${totalMb} MB in total. Report only — nothing changed.\n` +
        "Re-run with -e FIX=true to delete them. Take a backup first, and note the\n" +
        "videos themselves are gone for good unless you still have the originals.",
    )
  } else {
    let removed = 0
    for (const video of videos) {
      // Bytes first, then the record: an orphaned record is a visible row
      // someone can retry, whereas orphaned chunks are invisible forever.
      if (video.gridFsId) {
        db.getCollection("uploads.chunks").deleteMany({ files_id: video.gridFsId })
        db.getCollection("uploads.files").deleteMany({ _id: video.gridFsId })
      }
      db.fileassets.deleteOne({ _id: video._id })
      removed++
    }

    print(`\nRemoved ${removed} video file(s), freeing about ${totalMb} MB.`)
    print("Re-add them as YouTube links from the media area when you're ready.")
  }
}
