"use client"

import { useEffect, useMemo, useState } from "react"
import { Loader2, UserPlus, X } from "lucide-react"

import { useApi } from "@/hooks/use-api"
import { apiGet, apiMutate } from "@/lib/api/client"
import { AsyncState } from "@/components/ui/async-state"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Student {
  _id: string
  name: string
  studentId?: string
}

/**
 * Link the students a parent is guardian for. This is what makes a parent
 * appear in their child's teachers' contact lists and lets the parent see the
 * child's grades/skills. Saves the full children array via PATCH /api/users/:id.
 */
export function ChildrenDialog({
  parentId,
  parentName,
  open,
  onOpenChange,
  onChange,
}: {
  parentId: string | null
  parentName: string
  open: boolean
  onOpenChange: (o: boolean) => void
  onChange?: () => void
}) {
  const studentsReq = useApi<{ users: Student[] }>(open ? "/api/users?role=student&limit=100" : null)
  const students = useMemo(() => studentsReq.data?.users ?? [], [studentsReq.data])

  // Local working set of linked child ids, loaded from the parent record.
  const [childIds, setChildIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!open || !parentId) return
    setError("")
    setLoading(true)
    apiGet<{ children?: { _id: string }[] }>(`/api/users/${parentId}`)
      .then((u) => setChildIds((u.children ?? []).map((c) => c._id)))
      .catch(() => setError("Could not load linked students"))
      .finally(() => setLoading(false))
  }, [open, parentId])

  const linked = students.filter((s) => childIds.includes(s._id))
  const available = students.filter((s) => !childIds.includes(s._id))

  const add = () => {
    if (selected && !childIds.includes(selected)) setChildIds((ids) => [...ids, selected])
    setSelected("")
  }
  const remove = (id: string) => setChildIds((ids) => ids.filter((x) => x !== id))

  const save = async () => {
    if (!parentId) return
    setSaving(true)
    setError("")
    try {
      await apiMutate(`/api/users/${parentId}`, "PATCH", { children: childIds })
      onChange?.()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Linked students — {parentName}</DialogTitle>
          <DialogDescription>
            The students this parent is a guardian for. This connects them to those students&apos;
            teachers and progress.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Select value={selected} onValueChange={setSelected}>
              <SelectTrigger>
                <SelectValue placeholder={available.length ? "Choose a student" : "All students linked"} />
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
          <Button type="button" onClick={add} disabled={!selected}>
            <UserPlus className="h-4 w-4" />
            <span className="ml-2">Add</span>
          </Button>
        </div>

        {(error || studentsReq.error) && (
          <p className="text-sm text-red-600">{error || studentsReq.error}</p>
        )}

        <div className="max-h-56 overflow-y-auto rounded border">
          <AsyncState
            isLoading={loading}
            error={null}
            isEmpty={linked.length === 0}
            emptyMessage="No students linked yet."
          >
            <ul className="divide-y">
              {linked.map((s) => (
                <li key={s._id} className="flex items-center justify-between px-3 py-2">
                  <div>
                    <div className="font-medium">{s.name}</div>
                    {s.studentId && <div className="text-xs text-muted-foreground">{s.studentId}</div>}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => remove(s._id)}>
                    <X className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          </AsyncState>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
