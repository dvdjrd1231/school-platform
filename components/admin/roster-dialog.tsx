"use client"

import { useMemo, useState } from "react"
import { Loader2, UserPlus, X } from "lucide-react"

import { useApi } from "@/hooks/use-api"
import { apiMutate } from "@/lib/api/client"
import { AsyncState } from "@/components/ui/async-state"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface RosterRow {
  _id: string
  status: string
  student?: { _id: string; name?: string; email?: string; studentId?: string } | null
}
interface Student {
  _id: string
  name: string
  studentId?: string
}

/**
 * Manage a course roster: view enrolled students, enroll another, or drop one.
 * All actions go through /api/courses/:id/enroll (teacher/admin only).
 */
export function RosterDialog({
  courseId,
  courseTitle,
  open,
  onOpenChange,
  onChange,
}: {
  courseId: string | null
  courseTitle: string
  open: boolean
  onOpenChange: (o: boolean) => void
  onChange?: () => void
}) {
  const rosterReq = useApi<{ roster: RosterRow[] }>(
    open && courseId ? `/api/courses/${courseId}/enroll` : null,
  )
  const studentsReq = useApi<{ users: Student[] }>(open ? "/api/users?role=student&limit=200" : null)

  const [selected, setSelected] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  const roster = useMemo(
    () => (rosterReq.data?.roster ?? []).filter((r) => r.status !== "dropped"),
    [rosterReq.data],
  )
  const enrolledIds = new Set(roster.map((r) => r.student?._id))
  // Only offer students who aren't already on the roster.
  const available = (studentsReq.data?.users ?? []).filter((s) => !enrolledIds.has(s._id))

  const refresh = async () => {
    await rosterReq.refetch()
    onChange?.()
  }

  const enroll = async () => {
    if (!selected || !courseId) return
    setBusy(true)
    setError("")
    try {
      await apiMutate(`/api/courses/${courseId}/enroll`, "POST", { studentId: selected })
      setSelected("")
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not enroll the student")
    } finally {
      setBusy(false)
    }
  }

  const drop = async (studentId?: string) => {
    if (!studentId || !courseId) return
    await apiMutate(`/api/courses/${courseId}/enroll?studentId=${studentId}`, "DELETE").catch(() => {})
    await refresh()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Roster — {courseTitle}</DialogTitle>
          <DialogDescription>Enroll or remove students for this class.</DialogDescription>
        </DialogHeader>

        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Select value={selected} onValueChange={setSelected}>
              <SelectTrigger>
                <SelectValue placeholder={available.length ? "Choose a student to enroll" : "All students enrolled"} />
              </SelectTrigger>
              <SelectContent>
                {available.map((s) => (
                  <SelectItem key={s._id} value={s._id}>
                    {s.name}
                    {s.studentId ? ` (${s.studentId})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={enroll} disabled={busy || !selected}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            <span className="ml-2">Enroll</span>
          </Button>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="max-h-72 overflow-y-auto rounded border">
          <AsyncState
            isLoading={rosterReq.isLoading}
            error={rosterReq.error}
            isEmpty={roster.length === 0}
            emptyMessage="No students enrolled yet."
            onRetry={rosterReq.refetch}
          >
            <ul className="divide-y">
              {roster.map((r) => (
                <li key={r._id} className="flex items-center justify-between px-3 py-2">
                  <div>
                    <div className="font-medium">{r.student?.name ?? "Unknown"}</div>
                    <div className="text-xs text-muted-foreground">
                      {r.student?.studentId ?? r.student?.email ?? ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="capitalize">
                      {r.status}
                    </Badge>
                    <Button variant="ghost" size="sm" onClick={() => drop(r.student?._id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </AsyncState>
        </div>

        <p className="text-sm text-muted-foreground">{roster.length} enrolled</p>
      </DialogContent>
    </Dialog>
  )
}
