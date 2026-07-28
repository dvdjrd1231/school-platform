import { describe, expect, it } from "vitest"

import { lessonBodySchema, foreignPayloadKeys } from "@/lib/lessons/schemas"

/**
 * The client's rule is that a lesson's saved data must contain only fields
 * valid for its type, and that changing type must not preserve incompatible
 * hidden fields. The form enforces that visually; these cover the server side,
 * which is what actually decides what gets stored.
 */

const shared = {
  title: "A lesson",
  completion: { rule: "manual" as const },
  materials: [],
}

describe("lessonBodySchema", () => {
  it("keeps a reading lesson's own fields", () => {
    const result = lessonBodySchema.safeParse({
      ...shared,
      type: "reading",
      reading: { content: "<p>Hello</p>", teacherNotes: "Read carefully" },
    })

    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data).toMatchObject({
      type: "reading",
      reading: { content: "<p>Hello</p>", teacherNotes: "Read carefully" },
    })
  })

  it("drops another type's payload instead of storing it", () => {
    const result = lessonBodySchema.safeParse({
      ...shared,
      type: "reading",
      reading: { content: "<p>Hello</p>" },
      // Left over from when this lesson was a video. It must not survive.
      video: { source: "youtube", url: "https://youtu.be/abc" },
      interactive: { method: "link", url: "https://example.com", attempts: 0 },
    })

    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data).not.toHaveProperty("video")
    expect(result.data).not.toHaveProperty("interactive")
  })

  it("defaults a lesson to draft, so nothing is published by omission", () => {
    const result = lessonBodySchema.safeParse({ ...shared, type: "reading", reading: {} })

    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.status).toBe("draft")
  })

  it("refuses a video lesson with no video", () => {
    const result = lessonBodySchema.safeParse({
      ...shared,
      type: "video",
      completion: { rule: "watch-all" },
      video: { source: "youtube", url: "" },
    })

    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.error.issues.some((i) => i.message.includes("YouTube link"))).toBe(true)
  })

  it("accepts the shapes of YouTube link a teacher might paste", () => {
    const links = [
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "https://youtu.be/dQw4w9WgXcQ",
      "https://www.youtube.com/embed/dQw4w9WgXcQ",
      "https://www.youtube.com/shorts/dQw4w9WgXcQ",
      "youtu.be/dQw4w9WgXcQ",
    ]

    for (const url of links) {
      const result = lessonBodySchema.safeParse({
        ...shared,
        type: "video",
        completion: { rule: "watch-all" },
        video: { source: "youtube", url },
      })
      expect(result.success, `should accept ${url}`).toBe(true)
    }
  })

  it("refuses a video that isn't on YouTube", () => {
    // Previously these were allowed and rendered an empty player, so the
    // student was the one who found out.
    for (const url of ["https://vimeo.com/123456", "https://example.com/lesson.mp4"]) {
      const result = lessonBodySchema.safeParse({
        ...shared,
        type: "video",
        completion: { rule: "watch-all" },
        video: { source: "youtube", url },
      })
      expect(result.success, `should reject ${url}`).toBe(false)
    }
  })

  it("refuses an interactive lesson with no way to reach the activity", () => {
    const result = lessonBodySchema.safeParse({
      ...shared,
      type: "interactive",
      completion: { rule: "open" },
      interactive: { method: "embed", url: "", attempts: 0 },
    })

    expect(result.success).toBe(false)
  })

  it("refuses a completion rule that belongs to a different type", () => {
    // "watch 80%" is meaningless on a reading lesson.
    const result = lessonBodySchema.safeParse({
      ...shared,
      type: "reading",
      reading: {},
      completion: { rule: "watch-percent", watchPercent: 80 },
    })

    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.error.issues.some((i) => i.message.includes("reading lesson"))).toBe(true)
  })

  it("requires the threshold when a rule needs one", () => {
    const missingScore = lessonBodySchema.safeParse({
      ...shared,
      type: "quiz",
      quiz: {},
      completion: { rule: "min-score" },
    })
    expect(missingScore.success).toBe(false)

    const withScore = lessonBodySchema.safeParse({
      ...shared,
      type: "quiz",
      quiz: {},
      completion: { rule: "min-score", minScore: 70 },
    })
    expect(withScore.success).toBe(true)
  })

  it("treats an empty external link as absent rather than invalid", () => {
    const result = lessonBodySchema.safeParse({
      ...shared,
      type: "reading",
      reading: { content: "<p>Hi</p>", externalUrl: "" },
    })

    expect(result.success).toBe(true)
    if (!result.success || result.data.type !== "reading") return
    expect(result.data.reading.externalUrl).toBeUndefined()
  })

  it("rejects a malformed external link", () => {
    const result = lessonBodySchema.safeParse({
      ...shared,
      type: "reading",
      reading: { externalUrl: "notaurl" },
    })

    expect(result.success).toBe(false)
  })
})

describe("foreignPayloadKeys", () => {
  it("lists every payload except the type's own, so updates can clear them", () => {
    expect(foreignPayloadKeys("reading").sort()).toEqual(
      ["assignment", "interactive", "quiz", "video"].sort(),
    )
    expect(foreignPayloadKeys("quiz")).not.toContain("quiz")
  })
})
