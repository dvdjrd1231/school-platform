import { describe, expect, it } from "vitest"

import { normaliseLesson } from "@/lib/lessons/normalise"

/**
 * Lessons written before the typed payloads existed put their body in
 * `content` and their video link in `videoUrl`, whatever the type. These pin
 * down that those still read correctly, because the alternative — a migration
 * against a live database — has to be right first time.
 */

describe("normaliseLesson", () => {
  it("maps a legacy reading lesson's body into the reading payload", () => {
    const lesson = normaliseLesson({
      _id: "abc",
      title: "Chapter 1",
      type: "reading",
      order: 0,
      content: "Once upon a time",
    })

    expect(lesson.reading?.content).toBe("Once upon a time")
    expect(lesson.type).toBe("reading")
  })

  it("maps a legacy video lesson's link and body", () => {
    const lesson = normaliseLesson({
      _id: "abc",
      title: "Intro",
      type: "video",
      order: 0,
      videoUrl: "https://youtu.be/xyz",
      content: "Watch for the diagram at 2:00",
    })

    expect(lesson.video?.url).toBe("https://youtu.be/xyz")
    expect(lesson.video?.source).toBe("youtube")
    // The old body read as notes under the player.
    expect(lesson.video?.notes).toBe("Watch for the diagram at 2:00")
  })

  it("keeps the link of a lesson saved when non-YouTube sources were allowed", () => {
    // The link is preserved rather than dropped, so a teacher can see what it
    // was and replace it. The player refuses it and offers the link instead.
    const lesson = normaliseLesson({
      type: "video",
      order: 0,
      videoUrl: "https://vimeo.com/123",
    })

    expect(lesson.video?.url).toBe("https://vimeo.com/123")
    expect(lesson.video?.source).toBe("youtube")
  })

  it("prefers the typed payload over the legacy field once both exist", () => {
    const lesson = normaliseLesson({
      type: "reading",
      order: 0,
      content: "old body",
      reading: { content: "new body" },
    })

    expect(lesson.reading?.content).toBe("new body")
  })

  it("treats a lesson saved before per-lesson status as published", () => {
    // Defaulting to draft would silently hide content that has been live.
    expect(normaliseLesson({ type: "reading", order: 0 }).status).toBe("published")
    expect(normaliseLesson({ type: "reading", order: 0, status: "draft" }).status).toBe("draft")
  })

  it("falls back to the type's default rule when the stored one doesn't fit", () => {
    // A lesson converted from video to reading may still carry "watch-all".
    const lesson = normaliseLesson({
      type: "reading",
      order: 0,
      completion: { rule: "watch-all" },
    })

    expect(lesson.completion.rule).toBe("manual")
  })

  it("keeps a stored rule that is valid for the type", () => {
    const lesson = normaliseLesson({
      type: "video",
      order: 0,
      completion: { rule: "watch-percent", watchPercent: 90 },
    })

    expect(lesson.completion).toMatchObject({ rule: "watch-percent", watchPercent: 90 })
  })

  it("falls back to reading for an unrecognised type rather than throwing", () => {
    expect(normaliseLesson({ type: "something-else", order: 0 }).type).toBe("reading")
  })

  it("only populates the payload matching the type", () => {
    const lesson = normaliseLesson({
      type: "reading",
      order: 0,
      reading: { content: "body" },
      video: { source: "youtube", url: "https://youtu.be/x" },
    })

    expect(lesson.reading).toBeDefined()
    expect(lesson.video).toBeUndefined()
  })
})
