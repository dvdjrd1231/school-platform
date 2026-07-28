"use client"

import { useEffect, useRef } from "react"
import { Download, ExternalLink } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RichTextContent } from "@/components/ui/rich-text-editor"
import type { NormalisedLesson } from "@/lib/lessons/normalise"

interface Props {
  lesson: NormalisedLesson
  /** Called once the student reaches the end, for the `scroll` completion rule. */
  onReachedEnd?: () => void
}

/**
 * A reading lesson: a clean page of written content, plus anything attached.
 *
 * No player, no submission box, no question list — the completion control lives
 * in the shared lesson chrome below this.
 */
export function ReadingLesson({ lesson, onReachedEnd }: Props) {
  const endRef = useRef<HTMLDivElement>(null)
  const reading = lesson.reading

  // Watch for the bottom of the page coming into view. Only meaningful for the
  // "reach the bottom" rule, so the observer isn't created otherwise.
  useEffect(() => {
    if (!onReachedEnd || lesson.completion.rule !== "scroll") return
    const target = endRef.current
    if (!target) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          onReachedEnd()
          observer.disconnect()
        }
      },
      { rootMargin: "0px 0px -40px 0px" },
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [onReachedEnd, lesson.completion.rule])

  const hasBody = Boolean(reading?.content?.trim())

  return (
    <div className="space-y-6">
      {reading?.teacherNotes && (
        <div className="rounded-md border-l-4 border-emerald-500 bg-emerald-50 p-4">
          <p className="mb-1 text-sm font-medium text-emerald-900">Before you start</p>
          <p className="whitespace-pre-wrap text-sm text-emerald-800">{reading.teacherNotes}</p>
        </div>
      )}

      {hasBody ? (
        <Card>
          <CardContent className="py-8">
            <RichTextContent html={reading!.content!} className="prose-lg" />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Your teacher hasn&apos;t added the reading content yet.
          </CardContent>
        </Card>
      )}

      {reading?.externalUrl && (
        <a
          href={reading.externalUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-md border p-3 text-sm hover:bg-muted/50"
        >
          <ExternalLink className="h-4 w-4 text-emerald-600" />
          Continue reading on the linked page
        </a>
      )}

      {lesson.materials.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Reading material</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {lesson.materials.map((material) => (
              <a
                key={material.url}
                href={material.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between rounded-md border p-3 text-sm hover:bg-muted/50"
              >
                <span>{material.name}</span>
                <Download className="h-4 w-4 text-muted-foreground" />
              </a>
            ))}
          </CardContent>
        </Card>
      )}

      <div ref={endRef} aria-hidden />
    </div>
  )
}
