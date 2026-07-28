"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { MaterialsField } from "@/components/lessons/fields/materials-field"
import type { MaterialDraft, ReadingDraft } from "@/components/lessons/drafts"

interface Props {
  value: ReadingDraft
  onChange: (patch: Partial<ReadingDraft>) => void
  materials: MaterialDraft[]
  onMaterialsChange: (materials: MaterialDraft[]) => void
  courseId: string
}

/**
 * Reading lesson fields.
 *
 * Deliberately has no video link, no question builder and no submission
 * settings — those belong to other types, and showing them here is the exact
 * complaint this rewrite addresses.
 */
export function ReadingFields({
  value,
  onChange,
  materials,
  onMaterialsChange,
  courseId,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Reading content</Label>
        <RichTextEditor
          value={value.content}
          onChange={(content) => onChange({ content })}
          placeholder="Write the passage, article, or instructions students will read…"
          minHeight={18}
        />
        <p className="text-xs text-muted-foreground">
          Headings, lists, links, images and tables are supported.
        </p>
      </div>

      <MaterialsField
        label="Reading material"
        hint="A PDF, Word document or image students read alongside the text."
        courseId={courseId}
        materials={materials}
        onChange={onMaterialsChange}
      />

      <div className="space-y-2">
        <Label htmlFor="reading-external">External reading link (optional)</Label>
        <Input
          id="reading-external"
          value={value.externalUrl}
          onChange={(e) => onChange({ externalUrl: e.target.value })}
          placeholder="https://…"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="reading-notes">Teacher instructions (optional)</Label>
        <Textarea
          id="reading-notes"
          rows={3}
          value={value.teacherNotes}
          onChange={(e) => onChange({ teacherNotes: e.target.value })}
          placeholder="Anything students should know before they start reading."
        />
      </div>
    </div>
  )
}
