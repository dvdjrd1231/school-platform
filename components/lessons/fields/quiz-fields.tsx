"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { QuestionBuilder, type QuestionDraft } from "@/components/quizzes/question-builder"

/** The linked Quiz's settings, as the form holds them. */
export interface QuizSettings {
  instructions: string
  timeLimit: string
  attemptsAllowed: string
  passingScore: string
  shuffleQuestions: boolean
  shuffleAnswers: boolean
  oneQuestionAtATime: boolean
  allowBacktrack: boolean
  releaseResults: "immediately" | "after-review"
  showAnswers: boolean
  showExplanations: boolean
  availableFrom: string
  closesAt: string
}

export function blankQuizSettings(): QuizSettings {
  return {
    instructions: "",
    timeLimit: "0",
    attemptsAllowed: "1",
    passingScore: "0",
    shuffleQuestions: false,
    shuffleAnswers: false,
    oneQuestionAtATime: true,
    allowBacktrack: true,
    releaseResults: "immediately",
    showAnswers: true,
    showExplanations: true,
    availableFrom: "",
    closesAt: "",
  }
}

interface Props {
  value: QuizSettings
  onChange: (patch: Partial<QuizSettings>) => void
  questions: QuestionDraft[]
  onQuestionsChange: (questions: QuestionDraft[]) => void
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string
  hint?: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border p-3">
      <div>
        <Label>{label}</Label>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}

/**
 * Quiz lesson fields: assessment settings and the question builder.
 *
 * No general "lesson content" box, no video link, no upload settings — a quiz
 * lesson is its questions and the rules around them.
 */
export function QuizFields({ value, onChange, questions, onQuestionsChange }: Props) {
  const totalPoints = questions.reduce((sum, q) => sum + (Number(q.points) || 0), 0)

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="quiz-instructions">Student instructions</Label>
        <Textarea
          id="quiz-instructions"
          rows={3}
          value={value.instructions}
          onChange={(e) => onChange({ instructions: e.target.value })}
          placeholder="Read before you begin…"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="space-y-2">
          <Label>Total points</Label>
          <Input value={totalPoints} readOnly className="bg-muted" />
          <p className="text-xs text-muted-foreground">From the questions.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="quiz-pass">Passing score (%)</Label>
          <Input
            id="quiz-pass"
            type="number"
            min={0}
            max={100}
            value={value.passingScore}
            onChange={(e) => onChange({ passingScore: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="quiz-time">Time limit (min)</Label>
          <Input
            id="quiz-time"
            type="number"
            min={0}
            value={value.timeLimit}
            onChange={(e) => onChange({ timeLimit: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">0 = untimed.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="quiz-attempts">Attempts</Label>
          <Input
            id="quiz-attempts"
            type="number"
            min={0}
            value={value.attemptsAllowed}
            onChange={(e) => onChange({ attemptsAllowed: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">0 = unlimited.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="quiz-open">Opens (optional)</Label>
          <Input
            id="quiz-open"
            type="datetime-local"
            value={value.availableFrom}
            onChange={(e) => onChange({ availableFrom: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="quiz-close">Closes (optional)</Label>
          <Input
            id="quiz-close"
            type="datetime-local"
            value={value.closesAt}
            onChange={(e) => onChange({ closesAt: e.target.value })}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Toggle
          label="Shuffle questions"
          hint="Each student gets a different order."
          checked={value.shuffleQuestions}
          onChange={(shuffleQuestions) => onChange({ shuffleQuestions })}
        />
        <Toggle
          label="Shuffle answer choices"
          checked={value.shuffleAnswers}
          onChange={(shuffleAnswers) => onChange({ shuffleAnswers })}
        />
        <Toggle
          label="Show one question at a time"
          checked={value.oneQuestionAtATime}
          onChange={(oneQuestionAtATime) => onChange({ oneQuestionAtATime })}
        />
        <Toggle
          label="Allow returning to previous questions"
          hint="Turn off for a strictly forward-only test."
          checked={value.allowBacktrack}
          onChange={(allowBacktrack) => onChange({ allowBacktrack })}
        />
      </div>

      <div className="space-y-3 rounded-md border p-4">
        <div className="space-y-2">
          <Label>When do students see their result?</Label>
          <Select
            value={value.releaseResults}
            onValueChange={(v) =>
              onChange({ releaseResults: v as QuizSettings["releaseResults"] })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="immediately">Immediately after submitting</SelectItem>
              <SelectItem value="after-review">After I have reviewed it</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Objective questions are marked automatically either way; this controls what the
            student sees.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Toggle
            label="Show correct answers"
            checked={value.showAnswers}
            onChange={(showAnswers) => onChange({ showAnswers })}
          />
          <Toggle
            label="Show answer explanations"
            checked={value.showExplanations}
            onChange={(showExplanations) => onChange({ showExplanations })}
          />
        </div>
      </div>

      <QuestionBuilder questions={questions} onChange={onQuestionsChange} />
    </div>
  )
}
