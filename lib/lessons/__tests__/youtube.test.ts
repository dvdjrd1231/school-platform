import { describe, expect, it } from "vitest"

import { isYoutubeUrl, youtubeEmbedUrl, youtubeVideoId } from "@/lib/lessons/youtube"

const ID = "dQw4w9WgXcQ"

/**
 * Teachers paste whatever the address bar or the Share button gave them, so
 * every shape has to be understood — a link rejected here means a teacher
 * concludes the feature is broken.
 */
describe("youtubeVideoId", () => {
  it("reads the id from a standard watch link", () => {
    expect(youtubeVideoId(`https://www.youtube.com/watch?v=${ID}`)).toBe(ID)
  })

  it("reads it from a share link", () => {
    expect(youtubeVideoId(`https://youtu.be/${ID}`)).toBe(ID)
  })

  it("reads it from embed, shorts, live and /v/ links", () => {
    expect(youtubeVideoId(`https://www.youtube.com/embed/${ID}`)).toBe(ID)
    expect(youtubeVideoId(`https://www.youtube.com/shorts/${ID}`)).toBe(ID)
    expect(youtubeVideoId(`https://www.youtube.com/live/${ID}`)).toBe(ID)
    expect(youtubeVideoId(`https://www.youtube.com/v/${ID}`)).toBe(ID)
  })

  it("ignores extra query parameters, which share links always carry", () => {
    expect(youtubeVideoId(`https://www.youtube.com/watch?v=${ID}&t=42s&list=PLabc`)).toBe(ID)
    expect(youtubeVideoId(`https://youtu.be/${ID}?t=42`)).toBe(ID)
  })

  it("accepts a link pasted without the scheme", () => {
    expect(youtubeVideoId(`youtu.be/${ID}`)).toBe(ID)
    expect(youtubeVideoId(`www.youtube.com/watch?v=${ID}`)).toBe(ID)
  })

  it("accepts mobile, music and no-cookie hosts", () => {
    expect(youtubeVideoId(`https://m.youtube.com/watch?v=${ID}`)).toBe(ID)
    expect(youtubeVideoId(`https://music.youtube.com/watch?v=${ID}`)).toBe(ID)
    expect(youtubeVideoId(`https://www.youtube-nocookie.com/embed/${ID}`)).toBe(ID)
  })

  it("accepts a bare id, which is what gets copied between lessons", () => {
    expect(youtubeVideoId(ID)).toBe(ID)
  })

  it("tolerates surrounding whitespace from a clipboard paste", () => {
    expect(youtubeVideoId(`  https://youtu.be/${ID}  `)).toBe(ID)
  })

  it("rejects other video hosts", () => {
    expect(youtubeVideoId("https://vimeo.com/123456")).toBeNull()
    expect(youtubeVideoId("https://example.com/lesson.mp4")).toBeNull()
  })

  it("rejects a YouTube page that isn't a video", () => {
    expect(youtubeVideoId("https://www.youtube.com/results?search_query=algebra")).toBeNull()
    expect(youtubeVideoId("https://www.youtube.com/@somechannel")).toBeNull()
  })

  it("rejects rubbish without throwing", () => {
    expect(youtubeVideoId("")).toBeNull()
    expect(youtubeVideoId("   ")).toBeNull()
    expect(youtubeVideoId("not a url at all")).toBeNull()
    expect(youtubeVideoId("http://")).toBeNull()
  })

  it("rejects an id of the wrong length", () => {
    expect(youtubeVideoId("https://youtu.be/tooshort")).toBeNull()
  })
})

describe("isYoutubeUrl", () => {
  it("agrees with the id parser", () => {
    expect(isYoutubeUrl(`https://youtu.be/${ID}`)).toBe(true)
    expect(isYoutubeUrl("https://vimeo.com/1")).toBe(false)
  })
})

describe("youtubeEmbedUrl", () => {
  it("uses the no-cookie host, so watching is what starts tracking", () => {
    expect(youtubeEmbedUrl(ID)).toContain("youtube-nocookie.com")
  })

  it("only autoplays when asked", () => {
    expect(youtubeEmbedUrl(ID)).not.toContain("autoplay")
    expect(youtubeEmbedUrl(ID, { autoplay: true })).toContain("autoplay=1")
  })
})
