"use client"

import { useMemo } from "react"
import { ArrowDown, ArrowUp } from "lucide-react"

import { seededShuffle } from "@/lib/quizzes/question-types"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

export type QuestionType =
  | "multiple-choice"
  | "multiple-select"
  | "true-false"
  | "fill-blank"
  | "short-answer"
  | "essay"
  | "matching"
  | "ordering"

export interface TakeableQuestion {
  _id: string
  prompt: string
  type: QuestionType
  options: string[]
  pairs?: { left: string; right: string }[]
  points: number
  required?: boolean
  media?: { kind: "image" | "audio" | "video"; url: string }
  order: number
}

interface Props {
  question: TakeableQuestion
  /** The student's answer so far. Shape depends on the question type. */
  value: string[]
  onChange: (response: string[]) => void
  /** Stable seed so shuffled options don't reorder on every keystroke. */
  shuffleSeed: string
  shuffleAnswers: boolean
}

/** Split a fill-in-the-blank prompt into text segments around each ___ marker. */
function splitBlanks(prompt: string): string[] {
  return prompt.split(/_{3,}/)
}

/** The media attached to a question, if any. */
function QuestionMedia({ media }: { media: TakeableQuestion["media"] }) {
  if (!media) return null

  if (media.kind === "image") {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={media.url}
        alt="Question illustration"
        className="max-h-72 rounded-md border object-contain"
      />
    )
  }
  if (media.kind === "audio") {
    return <audio controls src={media.url} className="w-full" />
  }
  return <video controls src={media.url} className="w-full rounded-md border" />
}

/**
 * The answer control for one question.
 *
 * Split out of the quiz page so every question type has one implementation,
 * used by both the quiz screen and the practice-problem screen.
 */
export function QuestionInput({
  question,
  value,
  onChange,
  shuffleSeed,
  shuffleAnswers,
}: Props) {
  // Presentation order is derived from a seed, so it stays put while the student
  // is answering but differs between students.
  const options = useMemo(() => {
    if (!shuffleAnswers) return question.options
    return seededShuffle(question.options, `${shuffleSeed}:${question._id}`)
  }, [question.options, question._id, shuffleAnswers, shuffleSeed])

  // The server sends matching choices in `options`, already shuffled and with
  // no link back to the left-hand items — the pairing is the answer, so it
  // never reaches the browser.
  const rightHandChoices = question.options

  // Ordering items arrive already shuffled by the server (storing them in the
  // correct sequence means sending them in order would give the answer away).
  // Once the student starts rearranging, their own order takes over.
  const orderingItems = useMemo(
    () => (value.length === question.options.length && value.length > 0 ? value : question.options),
    [value, question.options],
  )

  switch (question.type) {
    case "multiple-choice":
    case "true-false":
      return (
        <div className="space-y-3">
          <QuestionMedia media={question.media} />
          <RadioGroup value={value[0] ?? ""} onValueChange={(v) => onChange([v])}>
            {options.map((option) => (
              <div key={option} className="flex items-center gap-2">
                <RadioGroupItem value={option} id={`${question._id}-${option}`} />
                <Label htmlFor={`${question._id}-${option}`} className="font-normal">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      )

    case "multiple-select":
      return (
        <div className="space-y-3">
          <QuestionMedia media={question.media} />
          <div className="space-y-2">
            {options.map((option) => (
              <div key={option} className="flex items-center gap-2">
                <Checkbox
                  id={`${question._id}-${option}`}
                  checked={value.includes(option)}
                  onCheckedChange={() =>
                    onChange(
                      value.includes(option)
                        ? value.filter((o) => o !== option)
                        : [...value, option],
                    )
                  }
                />
                <Label htmlFor={`${question._id}-${option}`} className="font-normal">
                  {option}
                </Label>
              </div>
            ))}
            <p className="text-xs text-muted-foreground">Tick every answer that applies.</p>
          </div>
        </div>
      )

    case "fill-blank": {
      const segments = splitBlanks(question.prompt)
      const blankCount = segments.length - 1

      return (
        <div className="space-y-3">
          <QuestionMedia media={question.media} />
          <p className="flex flex-wrap items-center gap-1 leading-loose">
            {segments.map((segment, i) => (
              <span key={i} className="flex flex-wrap items-center gap-1">
                <span>{segment}</span>
                {i < blankCount && (
                  <Input
                    aria-label={`Blank ${i + 1}`}
                    className="inline-block w-36"
                    value={value[i] ?? ""}
                    onChange={(e) => {
                      const next = [...value]
                      // Pad so blank 3 can be filled before blank 2.
                      while (next.length < blankCount) next.push("")
                      next[i] = e.target.value
                      onChange(next)
                    }}
                  />
                )}
              </span>
            ))}
          </p>
        </div>
      )
    }

    case "matching":
      return (
        <div className="space-y-3">
          <QuestionMedia media={question.media} />
          <div className="space-y-2">
            {(question.pairs ?? []).map((pair, i) => (
              <div key={pair.left} className="flex flex-wrap items-center gap-3">
                <span className="min-w-32 text-sm font-medium">{pair.left}</span>
                <span className="text-muted-foreground">→</span>
                <Select
                  value={value[i] ?? ""}
                  onValueChange={(choice) => {
                    const next = [...value]
                    while (next.length < (question.pairs?.length ?? 0)) next.push("")
                    next[i] = choice
                    onChange(next)
                  }}
                >
                  <SelectTrigger className="w-56">
                    <SelectValue placeholder="Choose…" />
                  </SelectTrigger>
                  <SelectContent>
                    {rightHandChoices.map((choice) => (
                      <SelectItem key={choice} value={choice}>
                        {choice}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </div>
      )

    case "ordering": {
      const move = (index: number, delta: number) => {
        const target = index + delta
        if (target < 0 || target >= orderingItems.length) return
        const next = [...orderingItems]
        ;[next[index], next[target]] = [next[target], next[index]]
        onChange(next)
      }

      return (
        <div className="space-y-3">
          <QuestionMedia media={question.media} />
          <p className="text-xs text-muted-foreground">
            Put these in the correct order using the arrows.
          </p>
          <ul className="space-y-2">
            {orderingItems.map((item, i) => (
              <li key={item} className="flex items-center gap-2 rounded-md border p-2">
                <span className="w-6 text-sm text-muted-foreground">{i + 1}.</span>
                <span className="flex-1 text-sm">{item}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={i === 0}
                  onClick={() => move(i, -1)}
                >
                  <ArrowUp className="h-4 w-4" />
                  <span className="sr-only">Move {item} up</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={i === orderingItems.length - 1}
                  onClick={() => move(i, 1)}
                >
                  <ArrowDown className="h-4 w-4" />
                  <span className="sr-only">Move {item} down</span>
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )
    }

    case "short-answer":
      return (
        <div className="space-y-3">
          <QuestionMedia media={question.media} />
          <Textarea
            rows={2}
            value={value[0] ?? ""}
            onChange={(e) => onChange([e.target.value])}
            placeholder="Type your answer"
          />
        </div>
      )

    case "essay":
      return (
        <div className="space-y-3">
          <QuestionMedia media={question.media} />
          <Textarea
            rows={10}
            value={value[0] ?? ""}
            onChange={(e) => onChange([e.target.value])}
            placeholder="Write your answer"
          />
          <p className="text-xs text-muted-foreground">Your teacher marks this one by hand.</p>
        </div>
      )
  }
}

/**
 * Has this question been answered?
 *
 * Used for the progress dots and the "still unanswered" warning, so it has to
 * agree with what each input above actually produces.
 */
export function isAnswered(question: TakeableQuestion, value: string[] | undefined): boolean {
  if (!value) return false

  if (question.type === "matching") {
    const expected = question.pairs?.length ?? 0
    return expected > 0 && value.filter((v) => v?.trim()).length === expected
  }
  if (question.type === "fill-blank") {
    const blanks = splitBlanks(question.prompt).length - 1
    return blanks > 0 && value.filter((v) => v?.trim()).length === blanks
  }
  if (question.type === "ordering") {
    return value.length === question.options.length
  }
  return value.some((v) => v?.trim())
}
