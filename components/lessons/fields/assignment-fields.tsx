"use client"

import { Plus, Trash2 } from "lucide-react"

import {
  FILE_TYPE_SPECS,
  SUBMISSION_TYPE_LABELS,
  acceptsFiles,
} from "@/lib/services/submission-rules"
import type { FileTypeGroup, SubmissionType } from "@/lib/models/Assignment"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { MaterialsField } from "@/components/lessons/fields/materials-field"
import type { MaterialDraft } from "@/components/lessons/drafts"

export interface RubricRowDraft {
  criterion: string
  description: string
  points: string
}

/** The linked Assignment's settings, as the form holds them. */
export interface AssignmentSettings {
  instructions: string
  dueDate: string
  points: string
  category: "homework" | "quiz" | "exam" | "project" | "participation"
  submissionType: SubmissionType
  allowedFileTypes: FileTypeGroup[]
  maxFileSizeMb: string
  maxFiles: string
  attemptsAllowed: string
  allowResubmission: boolean
  allowLateSubmission: boolean
  latePenaltyPerDay: string
  lateMessage: string
  rubric: RubricRowDraft[]
  gradingInstructions: string
  groupAssignment: boolean
}

export function blankAssignmentSettings(): AssignmentSettings {
  const inAWeek = new Date(Date.now() + 7 * 86_400_000)
  inAWeek.setHours(23, 59, 0, 0)
  const offset = inAWeek.getTimezoneOffset() * 60_000

  return {
    instructions: "",
    dueDate: new Date(inAWeek.getTime() - offset).toISOString().slice(0, 16),
    points: "10",
    category: "homework",
    submissionType: "file",
    allowedFileTypes: ["pdf", "doc"],
    maxFileSizeMb: "25",
    maxFiles: "1",
    attemptsAllowed: "0",
    allowResubmission: true,
    allowLateSubmission: true,
    latePenaltyPerDay: "10",
    lateMessage: "",
    rubric: [],
    gradingInstructions: "",
    groupAssignment: false,
  }
}

interface Props {
  value: AssignmentSettings
  onChange: (patch: Partial<AssignmentSettings>) => void
  materials: MaterialDraft[]
  onMaterialsChange: (materials: MaterialDraft[]) => void
  courseId: string
}

/**
 * Assignment lesson fields: how the work is set, handed in and marked.
 *
 * No video link, no question builder, no reading-completion settings. The file
 * rules only appear for submission types that actually take files.
 */
export function AssignmentFields({
  value,
  onChange,
  materials,
  onMaterialsChange,
  courseId,
}: Props) {
  const showFileRules = acceptsFiles(value.submissionType)
  const rubricTotal = value.rubric.reduce((sum, row) => sum + (Number(row.points) || 0), 0)

  const updateRubric = (index: number, patch: Partial<RubricRowDraft>) =>
    onChange({
      rubric: value.rubric.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    })

  const toggleFileType = (group: FileTypeGroup) =>
    onChange({
      allowedFileTypes: value.allowedFileTypes.includes(group)
        ? value.allowedFileTypes.filter((g) => g !== group)
        : [...value.allowedFileTypes, group],
    })

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>Detailed instructions</Label>
        <RichTextEditor
          value={value.instructions}
          onChange={(instructions) => onChange({ instructions })}
          placeholder="What students have to do, and what a good answer looks like…"
          minHeight={12}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="assignment-due">Due date and time</Label>
          <Input
            id="assignment-due"
            type="datetime-local"
            value={value.dueDate}
            onChange={(e) => onChange({ dueDate: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="assignment-points">Total points</Label>
          <Input
            id="assignment-points"
            type="number"
            min={0}
            value={value.points}
            onChange={(e) => onChange({ points: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Grade category</Label>
          <Select
            value={value.category}
            onValueChange={(category) =>
              onChange({ category: category as AssignmentSettings["category"] })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="homework">Homework</SelectItem>
              <SelectItem value="quiz">Quiz</SelectItem>
              <SelectItem value="exam">Exam</SelectItem>
              <SelectItem value="project">Project</SelectItem>
              <SelectItem value="participation">Participation</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Used for the weighted grade average.</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label>How do students submit?</Label>
        <Select
          value={value.submissionType}
          onValueChange={(submissionType) =>
            onChange({ submissionType: submissionType as SubmissionType })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(SUBMISSION_TYPE_LABELS).map(([type, label]) => (
              <SelectItem key={type} value={type}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showFileRules && (
        <div className="space-y-4 rounded-md border p-4">
          <div className="space-y-2">
            <Label>Allowed file types</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(Object.keys(FILE_TYPE_SPECS) as FileTypeGroup[]).map((group) => (
                <label key={group} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={value.allowedFileTypes.includes(group)}
                    onCheckedChange={() => toggleFileType(group)}
                  />
                  {FILE_TYPE_SPECS[group].label}
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Leave all unticked to accept any file type.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="assignment-size">Maximum file size (MB)</Label>
              <Input
                id="assignment-size"
                type="number"
                min={1}
                max={500}
                value={value.maxFileSizeMb}
                onChange={(e) => onChange({ maxFileSizeMb: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assignment-count">Maximum number of files</Label>
              <Input
                id="assignment-count"
                type="number"
                min={1}
                max={20}
                value={value.maxFiles}
                onChange={(e) => onChange({ maxFiles: e.target.value })}
              />
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="assignment-attempts">Submission attempts</Label>
          <Input
            id="assignment-attempts"
            type="number"
            min={0}
            value={value.attemptsAllowed}
            onChange={(e) => onChange({ attemptsAllowed: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">0 means unlimited.</p>
        </div>
        <div className="flex items-center justify-between rounded-md border p-3">
          <div>
            <Label>Allow resubmissions</Label>
            <p className="text-xs text-muted-foreground">Until you mark the work.</p>
          </div>
          <Switch
            checked={value.allowResubmission}
            onCheckedChange={(allowResubmission) => onChange({ allowResubmission })}
          />
        </div>
      </div>

      <div className="space-y-3 rounded-md border p-4">
        <div className="flex items-center justify-between">
          <div>
            <Label>Allow late submissions</Label>
            <p className="text-xs text-muted-foreground">
              Work handed in after the deadline is accepted with a penalty.
            </p>
          </div>
          <Switch
            checked={value.allowLateSubmission}
            onCheckedChange={(allowLateSubmission) => onChange({ allowLateSubmission })}
          />
        </div>

        {value.allowLateSubmission && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="assignment-penalty">Penalty per day late (%)</Label>
              <Input
                id="assignment-penalty"
                type="number"
                min={0}
                max={100}
                value={value.latePenaltyPerDay}
                onChange={(e) => onChange({ latePenaltyPerDay: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assignment-late-message">Message shown when late</Label>
              <Input
                id="assignment-late-message"
                value={value.lateMessage}
                onChange={(e) => onChange({ lateMessage: e.target.value })}
                placeholder="This is now late — 10% is deducted per day."
              />
            </div>
          </div>
        )}
      </div>

      <MaterialsField
        label="Teacher attachments"
        hint="Briefs, templates or source material students need."
        courseId={courseId}
        materials={materials}
        onChange={onMaterialsChange}
      />

      <div className="space-y-3 rounded-md border p-4">
        <div className="flex items-center justify-between">
          <div>
            <Label>Rubric</Label>
            <p className="text-xs text-muted-foreground">
              {value.rubric.length > 0
                ? `${rubricTotal} points across ${value.rubric.length} criteria${
                    Number(value.points) && rubricTotal !== Number(value.points)
                      ? ` — the assignment is worth ${value.points}`
                      : ""
                  }`
                : "How the work is judged. Students see this before they start."}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              onChange({
                rubric: [...value.rubric, { criterion: "", description: "", points: "" }],
              })
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Add criterion
          </Button>
        </div>

        {value.rubric.map((row, index) => (
          <div key={index} className="grid gap-2 sm:grid-cols-[1fr_1.5fr_90px_40px]">
            <Input
              value={row.criterion}
              onChange={(e) => updateRubric(index, { criterion: e.target.value })}
              placeholder="Criterion"
            />
            <Input
              value={row.description}
              onChange={(e) => updateRubric(index, { description: e.target.value })}
              placeholder="What earns the marks"
            />
            <Input
              type="number"
              min={0}
              value={row.points}
              onChange={(e) => updateRubric(index, { points: e.target.value })}
              placeholder="Points"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-red-600"
              onClick={() => onChange({ rubric: value.rubric.filter((_, i) => i !== index) })}
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Remove criterion</span>
            </Button>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <Label htmlFor="assignment-grading">Grading instructions (optional)</Label>
        <Textarea
          id="assignment-grading"
          rows={3}
          value={value.gradingInstructions}
          onChange={(e) => onChange({ gradingInstructions: e.target.value })}
          placeholder="Notes for whoever marks this. Not shown to students."
        />
      </div>

      <div className="flex items-center justify-between rounded-md border p-3">
        <div>
          <Label>Group assignment</Label>
          <p className="text-xs text-muted-foreground">One submission per group rather than per student.</p>
        </div>
        <Switch
          checked={value.groupAssignment}
          onCheckedChange={(groupAssignment) => onChange({ groupAssignment })}
        />
      </div>
    </div>
  )
}
