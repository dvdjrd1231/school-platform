"use client"

import { ChevronDown, ChevronUp, GripVertical, Plus, Trash2 } from "lucide-react"

import { countBlanks } from "@/lib/quizzes/question-types"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

export interface PairDraft {
  left: string
  right: string
}

export interface QuestionDraft {
  key: string
  prompt: string
  type: QuestionType
  options: string[]
  correctAnswers: string[]
  pairs: PairDraft[]
  points: string
  explanation: string
  required: boolean
  mediaUrl: string
  mediaKind: "image" | "audio" | "video"
}

const TYPE_LABELS: Record<QuestionType, string> = {
  "multiple-choice": "Multiple choice (one answer)",
  "multiple-select": "Multiple select (several answers)",
  "true-false": "True or false",
  "fill-blank": "Fill in the blank",
  "short-answer": "Short answer",
  essay: "Essay (you mark it)",
  matching: "Matching",
  ordering: "Ordering / sequencing",
}

let counter = 0
export const nextQuestionKey = () => `q${Date.now()}-${++counter}`

export function blankQuestion(): QuestionDraft {
  return {
    key: nextQuestionKey(),
    prompt: "",
    type: "multiple-choice",
    options: ["", ""],
    correctAnswers: [],
    pairs: [
      { left: "", right: "" },
      { left: "", right: "" },
    ],
    points: "1",
    explanation: "",
    required: false,
    mediaUrl: "",
    mediaKind: "image",
  }
}

export function usesOptions(type: QuestionType): boolean {
  return type === "multiple-choice" || type === "multiple-select"
}

/**
 * Validate the questions, returning the first problem found.
 *
 * Runs before saving so a teacher isn't told "invalid" by the server without
 * being told which question is at fault.
 */
export function validateQuestions(questions: QuestionDraft[]): string | null {
  for (const [i, q] of questions.entries()) {
    const at = `Question ${i + 1}`
    if (!q.prompt.trim()) return `${at} needs a prompt`

    if (usesOptions(q.type)) {
      const filled = q.options.filter((o) => o.trim())
      if (filled.length < 2) return `${at} needs at least two options`
      if (q.correctAnswers.filter((a) => a.trim()).length === 0) {
        return `Mark the correct answer for ${at}`
      }
    }
    if (q.type === "true-false" && q.correctAnswers.length === 0) {
      return `Mark True or False for ${at}`
    }
    if (q.type === "short-answer" && q.correctAnswers.filter((a) => a.trim()).length === 0) {
      return `${at} needs at least one accepted answer`
    }
    if (q.type === "fill-blank") {
      const blanks = countBlanks(q.prompt)
      if (blanks === 0) return `${at}: mark each blank in the prompt with ___`
      if (q.correctAnswers.filter((a) => a.trim()).length < blanks) {
        return `${at} has ${blanks} blank(s) but fewer answers`
      }
    }
    if (q.type === "matching") {
      const pairs = q.pairs.filter((p) => p.left.trim() && p.right.trim())
      if (pairs.length < 2) return `${at} needs at least two complete pairs`
    }
    if (q.type === "ordering") {
      const items = q.options.filter((o) => o.trim())
      if (items.length < 2) return `${at} needs at least two items to order`
    }
  }
  return null
}

/** Turn the drafts into the API's question shape. */
export function questionsToPayload(questions: QuestionDraft[]) {
  return questions.map((q, index) => ({
    prompt: q.prompt.trim(),
    type: q.type,
    options:
      usesOptions(q.type) || q.type === "true-false" || q.type === "ordering"
        ? q.options.filter((o) => o.trim())
        : [],
    correctAnswers:
      q.type === "matching" || q.type === "ordering" || q.type === "essay"
        ? []
        : q.correctAnswers.filter((a) => a.trim()),
    pairs:
      q.type === "matching" ? q.pairs.filter((p) => p.left.trim() && p.right.trim()) : [],
    points: Number(q.points) || 0,
    explanation: q.explanation.trim() || undefined,
    required: q.required,
    media: q.mediaUrl.trim() ? { kind: q.mediaKind, url: q.mediaUrl.trim() } : undefined,
    order: index,
  }))
}

interface Props {
  questions: QuestionDraft[]
  onChange: (questions: QuestionDraft[]) => void
}

/**
 * The quiz question builder.
 *
 * Shared by the lesson form and the standalone quiz editor so the two can't
 * drift — a question type added here works in both immediately.
 */
export function QuestionBuilder({ questions, onChange }: Props) {
  const update = (key: string, patch: Partial<QuestionDraft>) =>
    onChange(questions.map((q) => (q.key === key ? { ...q, ...patch } : q)))

  const move = (index: number, delta: number) => {
    const target = index + delta
    if (target < 0 || target >= questions.length) return
    const next = [...questions]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  const changeType = (key: string, type: QuestionType) =>
    onChange(
      questions.map((q) => {
        if (q.key !== key) return q
        // Reset the answer key: options from the previous type are meaningless
        // against the new one, and keeping them would save a wrong answer key.
        if (type === "true-false") {
          return { ...q, type, options: ["True", "False"], correctAnswers: [] }
        }
        if (usesOptions(type) || type === "ordering") {
          return {
            ...q,
            type,
            options: q.options.filter((o) => o.trim()).length >= 2 ? q.options : ["", ""],
            correctAnswers: [],
          }
        }
        return { ...q, type, options: [], correctAnswers: [] }
      }),
    )

  const toggleCorrect = (key: string, option: string, multi: boolean) =>
    onChange(
      questions.map((q) => {
        if (q.key !== key) return q
        if (!multi) return { ...q, correctAnswers: [option] }
        return {
          ...q,
          correctAnswers: q.correctAnswers.includes(option)
            ? q.correctAnswers.filter((a) => a !== option)
            : [...q.correctAnswers, option],
        }
      }),
    )

  const totalPoints = questions.reduce((sum, q) => sum + (Number(q.points) || 0), 0)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold">
          Questions ({questions.length}) · {totalPoints} points
        </h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...questions, blankQuestion()])}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add question
        </Button>
      </div>

      {questions.length === 0 && (
        <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
          No questions yet. Add the first one — students answer these on the platform.
        </p>
      )}

      {questions.map((question, index) => (
        <Card key={question.key}>
          <CardContent className="space-y-3 pt-4">
            <div className="flex items-start gap-2">
              <div className="mt-1 flex flex-col">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  <ChevronUp className="h-4 w-4" />
                  <span className="sr-only">Move up</span>
                </Button>
                <GripVertical className="h-4 w-4 self-center text-muted-foreground" />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  disabled={index === questions.length - 1}
                  onClick={() => move(index, 1)}
                >
                  <ChevronDown className="h-4 w-4" />
                  <span className="sr-only">Move down</span>
                </Button>
              </div>

              <div className="flex-1 space-y-2">
                <Label>Question {index + 1}</Label>
                <Textarea
                  rows={2}
                  value={question.prompt}
                  onChange={(e) => update(question.key, { prompt: e.target.value })}
                  placeholder={
                    question.type === "fill-blank"
                      ? "The capital of France is ___."
                      : "What is 3 × 4?"
                  }
                />
                {question.type === "fill-blank" && (
                  <p className="text-xs text-muted-foreground">
                    Mark each blank with three underscores (___). Found{" "}
                    {countBlanks(question.prompt)}.
                  </p>
                )}
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-red-600"
                onClick={() => onChange(questions.filter((q) => q.key !== question.key))}
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Remove question</span>
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-[1fr_100px_auto]">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={question.type}
                  onValueChange={(v) => changeType(question.key, v as QuestionType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(TYPE_LABELS) as QuestionType[]).map((type) => (
                      <SelectItem key={type} value={type}>
                        {TYPE_LABELS[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Points</Label>
                <Input
                  type="number"
                  min={0}
                  value={question.points}
                  onChange={(e) => update(question.key, { points: e.target.value })}
                />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={question.required}
                    onCheckedChange={(required) =>
                      update(question.key, { required: required === true })
                    }
                  />
                  Required
                </label>
              </div>
            </div>

            {question.type === "true-false" && (
              <div className="space-y-2">
                <Label>Correct answer</Label>
                <div className="flex gap-4">
                  {["True", "False"].map((option) => (
                    <label key={option} className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name={`tf-${question.key}`}
                        checked={question.correctAnswers[0] === option}
                        onChange={() => toggleCorrect(question.key, option, false)}
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {usesOptions(question.type) && (
              <div className="space-y-2">
                <Label>
                  Options —{" "}
                  {question.type === "multiple-select"
                    ? "tick every correct one"
                    : "tick the correct one"}
                </Label>
                {question.options.map((option, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <input
                      type={question.type === "multiple-select" ? "checkbox" : "radio"}
                      name={`opt-${question.key}`}
                      checked={Boolean(option) && question.correctAnswers.includes(option)}
                      disabled={!option.trim()}
                      onChange={() =>
                        toggleCorrect(question.key, option, question.type === "multiple-select")
                      }
                    />
                    <Input
                      value={option}
                      placeholder={`Option ${oi + 1}`}
                      onChange={(e) => {
                        const previous = option
                        const options = [...question.options]
                        options[oi] = e.target.value
                        // Follow the rename through the answer key, or marking
                        // the option correct then editing it would lose the mark.
                        update(question.key, {
                          options,
                          correctAnswers: question.correctAnswers.map((a) =>
                            a === previous ? e.target.value : a,
                          ),
                        })
                      }}
                    />
                    {question.options.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          update(question.key, {
                            options: question.options.filter((_, i) => i !== oi),
                            correctAnswers: question.correctAnswers.filter((a) => a !== option),
                          })
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remove option</span>
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => update(question.key, { options: [...question.options, ""] })}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add option
                </Button>
              </div>
            )}

            {question.type === "ordering" && (
              <div className="space-y-2">
                <Label>Items, in the correct order</Label>
                <p className="text-xs text-muted-foreground">
                  Students see them shuffled and put them back in this order.
                </p>
                {question.options.map((option, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <span className="w-6 text-sm text-muted-foreground">{oi + 1}.</span>
                    <Input
                      value={option}
                      placeholder={`Step ${oi + 1}`}
                      onChange={(e) => {
                        const options = [...question.options]
                        options[oi] = e.target.value
                        update(question.key, { options })
                      }}
                    />
                    {question.options.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          update(question.key, {
                            options: question.options.filter((_, i) => i !== oi),
                          })
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remove item</span>
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => update(question.key, { options: [...question.options, ""] })}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add item
                </Button>
              </div>
            )}

            {question.type === "matching" && (
              <div className="space-y-2">
                <Label>Pairs</Label>
                <p className="text-xs text-muted-foreground">
                  Students match the left column to the right, which they see shuffled.
                </p>
                {question.pairs.map((pair, pi) => (
                  <div key={pi} className="flex items-center gap-2">
                    <Input
                      value={pair.left}
                      placeholder="Left"
                      onChange={(e) => {
                        const pairs = [...question.pairs]
                        pairs[pi] = { ...pair, left: e.target.value }
                        update(question.key, { pairs })
                      }}
                    />
                    <span className="text-muted-foreground">→</span>
                    <Input
                      value={pair.right}
                      placeholder="Right"
                      onChange={(e) => {
                        const pairs = [...question.pairs]
                        pairs[pi] = { ...pair, right: e.target.value }
                        update(question.key, { pairs })
                      }}
                    />
                    {question.pairs.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          update(question.key, {
                            pairs: question.pairs.filter((_, i) => i !== pi),
                          })
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remove pair</span>
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    update(question.key, { pairs: [...question.pairs, { left: "", right: "" }] })
                  }
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add pair
                </Button>
              </div>
            )}

            {question.type === "short-answer" && (
              <div className="space-y-2">
                <Label>Accepted answers</Label>
                <Input
                  value={question.correctAnswers.join(", ")}
                  onChange={(e) =>
                    update(question.key, {
                      correctAnswers: e.target.value.split(",").map((a) => a.trim()),
                    })
                  }
                  placeholder="12, twelve"
                />
                <p className="text-xs text-muted-foreground">
                  Comma separated. Any one counts as correct; case and spacing are ignored.
                </p>
              </div>
            )}

            {question.type === "fill-blank" && (
              <div className="space-y-2">
                <Label>Answers, one line per blank</Label>
                <Textarea
                  rows={Math.max(2, countBlanks(question.prompt))}
                  value={question.correctAnswers.join("\n")}
                  onChange={(e) =>
                    update(question.key, { correctAnswers: e.target.value.split("\n") })
                  }
                  placeholder={"Paris\nSeine|River Seine"}
                />
                <p className="text-xs text-muted-foreground">
                  One line per blank, in order. Separate alternatives for the same blank with |.
                </p>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-[110px_1fr]">
              <div className="space-y-2">
                <Label>Media</Label>
                <Select
                  value={question.mediaKind}
                  onValueChange={(v) =>
                    update(question.key, { mediaKind: v as QuestionDraft["mediaKind"] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="audio">Audio</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Media link (optional)</Label>
                <Input
                  value={question.mediaUrl}
                  onChange={(e) => update(question.key, { mediaUrl: e.target.value })}
                  placeholder="https://…"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Explanation or feedback (optional)</Label>
              <Input
                value={question.explanation}
                onChange={(e) => update(question.key, { explanation: e.target.value })}
                placeholder="Shown after submitting, when the quiz reveals answers"
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
