import { describe, expect, it } from "vitest"

import { checkUploadType } from "@/lib/storage/upload-policy"

/** True when the file would be accepted. */
function accepts(contentType: string, filename = ""): boolean {
  return checkUploadType(contentType, filename).ok
}

/** The refusal reason, or "" when the file was accepted. */
function reason(contentType: string, filename = ""): string {
  const verdict = checkUploadType(contentType, filename)
  return verdict.ok ? "" : verdict.message
}

/**
 * The upload allowlist is the last line before bytes reach the database, so it
 * is tested directly rather than only through a route.
 */
describe("checkUploadType", () => {
  it("accepts the document and image types a school actually uploads", () => {
    expect(accepts("application/pdf", "worksheet.pdf")).toBe(true)
    expect(accepts("image/png", "diagram.png")).toBe(true)
    expect(accepts("image/jpeg", "photo.jpg")).toBe(true)
    expect(accepts("audio/mpeg", "reading.mp3")).toBe(true)
    expect(
      accepts(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "essay.docx",
      ),
    ).toBe(true)
  })

  it("tolerates a charset parameter on the type", () => {
    expect(accepts("text/plain; charset=utf-8", "notes.txt")).toBe(true)
  })

  describe("video", () => {
    // Videos are YouTube links instead, so the hosting and the bandwidth are
    // YouTube's rather than one VPS serving every student.
    it("refuses video by MIME type", () => {
      expect(reason("video/mp4", "lesson.mp4")).toMatch(/YouTube/)
      expect(reason("video/quicktime", "clip.mov")).toMatch(/YouTube/)
    })

    it("refuses video by extension even when the browser reports a generic type", () => {
      // A .mov commonly arrives as application/octet-stream, which would sail
      // straight past a type-only check.
      expect(reason("application/octet-stream", "lesson.mov")).toMatch(/YouTube/)
      expect(reason("", "lesson.mkv")).toMatch(/YouTube/)
      expect(reason("application/octet-stream", "LESSON.MP4")).toMatch(/YouTube/)
    })

    it("points the person at what to do instead of just refusing", () => {
      expect(reason("video/mp4", "a.mp4")).toMatch(/paste its link/i)
    })

    it("doesn't mistake a document whose name merely mentions a video format", () => {
      expect(accepts("application/pdf", "how-to-edit-mp4-files.pdf")).toBe(true)
    })
  })

  it("refuses SVG, which is an image that can carry script", () => {
    expect(reason("image/svg+xml", "icon.svg")).toMatch(/SVG/)
  })

  it("refuses anything not on the allowlist", () => {
    expect(accepts("application/x-msdownload", "setup.exe")).toBe(false)
    expect(accepts("text/html", "page.html")).toBe(false)
  })
})
