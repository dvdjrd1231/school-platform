"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, ArrowRight, Loader2 } from "lucide-react"

import { apiMutate } from "@/lib/api/client"
import { useConfirm } from "@/components/ui/confirm-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

interface PromotionPreview {
  student: { _id: string; name: string }
  fromGradeLevel: string | null
  toGradeLevel: string
  closing: { courseId: string; title: string }[]
  joining: { courseId: string; title: string }[]
}

interface Props {
  open: boolean
  student: { _id: string; name?: string; gradeLevel?: string }
  onOpenChange: (open: boolean) => void
  onPromoted: () => void
}

/**
 * Promote a student to the next grade level.
 *
 * The client asked for "triple confirmation", and this is what that means here,
 * in three genuinely different steps rather than three identical "are you sure"
 * boxes:
 *   1. a dry run against the server showing exactly which classes close and
 *      which open — no guessing about the effect;
 *   2. a confirmation naming the student and both grades;
 *   3. typing the student's name to commit.
 */
export function PromoteStudentDialog({ open, student, onOpenChange, onPromoted }: Props) {
  const [toGradeLevel, setToGradeLevel] = useState("")
  const [enrollInNewGrade, setEnrollInNewGrade] = useState(true)
  const [preview, setPreview] = useState<PromotionPreview | null>(null)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [confirm, confirmDialog] = useConfirm()

  useEffect(() => {
    if (!open) return
    setToGradeLevel("")
    setPreview(null)
    setError("")
  }, [open])

  const runPreview = async () => {
    if (!toGradeLevel.trim()) return setError("Enter the grade level they're moving to")

    setBusy(true)
    setError("")
    try {
      const result = await apiMutate<PromotionPreview>(
        `/api/students/${student._id}/promote`,
        "POST",
        { toGradeLevel: toGradeLevel.trim(), enrollInNewGrade, dryRun: true },
      )
      setPreview(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not check the promotion")
    } finally {
      setBusy(false)
    }
  }

  const commit = async () => {
    if (!preview) return

    // Step two: state plainly what is about to happen.
    const understood = await confirm({
      title: `Move ${preview.student.name} to ${preview.toGradeLevel}?`,
      description: (
        <div className="space-y-2">
          <p>
            {preview.closing.length} current class
            {preview.closing.length === 1 ? "" : "es"} will close, and{" "}
            {preview.joining.length} new one{preview.joining.length === 1 ? "" : "s"} will open.
          </p>
          <p>
            Their grades and submitted work are kept — the old classes move to completed rather
            than being deleted.
          </p>
        </div>
      ),
      confirmLabel: "Continue",
      destructive: false,
    })
    if (!understood) return

    // Step three: type the name. Deliberately harder than a second click.
    const typed = await confirm({
      title: "Confirm the promotion",
      description: "This changes which classes the student can reach. Type their name to confirm.",
      confirmLabel: "Promote",
      requireText: preview.student.name,
    })
    if (!typed) return

    setBusy(true)
    setError("")
    try {
      await apiMutate(`/api/students/${student._id}/promote`, "POST", {
        toGradeLevel: preview.toGradeLevel,
        enrollInNewGrade,
      })
      onPromoted()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not promote the student")
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Promote {student.name ?? "student"}</DialogTitle>
            <DialogDescription>
              Currently in {student.gradeLevel || "no grade level set"}. Moving them up closes
              their old grade&apos;s classes and opens the new grade&apos;s active ones.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Move to grade level</Label>
              <Input
                value={toGradeLevel}
                onChange={(e) => {
                  setToGradeLevel(e.target.value)
                  setPreview(null)
                }}
                placeholder="e.g. 2nd Grade"
              />
              <p className="text-xs text-muted-foreground">
                Must match the grade level set on the classes for that year.
              </p>
            </div>

            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <Label>Enrol in the new grade&apos;s classes</Label>
                <p className="text-xs text-muted-foreground">
                  Only classes that are already active — drafts are left alone.
                </p>
              </div>
              <Switch
                checked={enrollInNewGrade}
                onCheckedChange={(v) => {
                  setEnrollInNewGrade(v)
                  setPreview(null)
                }}
              />
            </div>

            {preview && (
              <div className="space-y-3 rounded-md border bg-muted/40 p-3 text-sm">
                <p className="flex items-center gap-2 font-medium">
                  {preview.fromGradeLevel ?? "No grade"} <ArrowRight className="h-4 w-4" />{" "}
                  {preview.toGradeLevel}
                </p>

                <div>
                  <p className="font-medium">Closing ({preview.closing.length})</p>
                  {preview.closing.length === 0 ? (
                    <p className="text-muted-foreground">Nothing to close.</p>
                  ) : (
                    <ul className="list-inside list-disc text-muted-foreground">
                      {preview.closing.map((c) => (
                        <li key={c.courseId}>{c.title}</li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <p className="font-medium">Opening ({preview.joining.length})</p>
                  {preview.joining.length === 0 ? (
                    <p className="text-muted-foreground">
                      No active classes are tagged {preview.toGradeLevel} yet.
                    </p>
                  ) : (
                    <ul className="list-inside list-disc text-muted-foreground">
                      {preview.joining.map((c) => (
                        <li key={c.courseId}>{c.title}</li>
                      ))}
                    </ul>
                  )}
                </div>

                {preview.joining.length === 0 && (
                  <p className="flex items-start gap-2 text-amber-700">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    They&apos;ll have no classes until one is tagged {preview.toGradeLevel} and made
                    active.
                  </p>
                )}
              </div>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
              Cancel
            </Button>
            {preview ? (
              <Button onClick={() => void commit()} disabled={busy}>
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Promote…
              </Button>
            ) : (
              <Button onClick={() => void runPreview()} disabled={busy}>
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Check what changes
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {confirmDialog}
    </>
  )
}
