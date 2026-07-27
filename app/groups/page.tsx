"use client"

import { useState } from "react"
import { Loader2, LogOut, Pencil, Plus, Trash2, UserPlus, Users } from "lucide-react"

import { useApi } from "@/hooks/use-api"
import { apiMutate } from "@/lib/api/client"
import { useCourses } from "@/components/context/course-context"
import { useRole } from "@/components/context/role-context"
import { AsyncState } from "@/components/ui/async-state"
import { useConfirm } from "@/components/ui/confirm-dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface Member {
  _id: string
  name?: string
  email?: string
}

interface GroupItem {
  _id: string
  name: string
  description?: string
  maxMembers: number
  joinPolicy: "open" | "closed"
  members: Member[]
  memberCount: number
  isMember: boolean
  isOwner: boolean
  createdBy?: { name?: string } | null
  course?: { _id: string; title: string } | null
}

function initials(name?: string): string {
  if (!name) return "?"
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("")
}

interface GroupForm {
  name: string
  description: string
  course: string
  maxMembers: number
  joinPolicy: "open" | "closed"
}

const EMPTY: GroupForm = {
  name: "",
  description: "",
  course: "",
  maxMembers: 0,
  joinPolicy: "open",
}

/**
 * Study groups.
 *
 * The page was empty and its nav link 404'd, and the client reasonably asked
 * what groups even were. They're working groups inside a class: a teacher can
 * split a class into them, or students can start their own. Open groups anyone
 * in the class can join; closed ones the owner manages.
 */
export default function GroupsPage() {
  const { isTeacher, isAdmin } = useRole()
  const { courses, selectedId, select } = useCourses()
  const canModerate = isTeacher || isAdmin

  const { data, error, isLoading, refetch } = useApi<{ groups: GroupItem[] }>(
    selectedId ? `/api/groups?courseId=${selectedId}` : "/api/groups",
  )
  const groups = data?.groups ?? []

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<GroupForm>(EMPTY)
  const [formError, setFormError] = useState("")
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [confirm, confirmDialog] = useConfirm()

  const openCreate = () => {
    setEditingId(null)
    setForm({ ...EMPTY, course: selectedId ?? "" })
    setFormError("")
    setDialogOpen(true)
  }

  const openEdit = (group: GroupItem) => {
    setEditingId(group._id)
    setForm({
      name: group.name,
      description: group.description ?? "",
      course: group.course?._id ?? "",
      maxMembers: group.maxMembers,
      joinPolicy: group.joinPolicy,
    })
    setFormError("")
    setDialogOpen(true)
  }

  const save = async () => {
    setFormError("")
    if (form.name.trim().length < 2) return setFormError("Give the group a name")
    if (!editingId && !form.course) return setFormError("Choose which class this group is for")

    setSaving(true)
    try {
      if (editingId) {
        await apiMutate(`/api/groups/${editingId}`, "PATCH", {
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          maxMembers: Number(form.maxMembers) || 0,
          joinPolicy: form.joinPolicy,
        })
      } else {
        await apiMutate("/api/groups", "POST", {
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          course: form.course,
          maxMembers: Number(form.maxMembers) || 0,
          joinPolicy: form.joinPolicy,
        })
      }
      setDialogOpen(false)
      await refetch()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not save the group")
    } finally {
      setSaving(false)
    }
  }

  const membership = async (group: GroupItem, action: "join" | "leave") => {
    setBusyId(group._id)
    try {
      await apiMutate(`/api/groups/${group._id}`, "POST", { action })
      await refetch()
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Could not update your membership")
    } finally {
      setBusyId(null)
    }
  }

  const removeMember = async (group: GroupItem, member: Member) => {
    const ok = await confirm({
      title: `Remove ${member.name ?? "this member"}?`,
      description: `They'll be taken out of "${group.name}". They can be added back later.`,
      confirmLabel: "Remove",
    })
    if (!ok) return
    await apiMutate(`/api/groups/${group._id}`, "POST", { action: "leave", userId: member._id })
    await refetch()
  }

  const remove = async (group: GroupItem) => {
    const ok = await confirm({
      title: `Delete "${group.name}"?`,
      description: `The group and its ${group.memberCount} member(s) will be removed. This cannot be undone.`,
    })
    if (!ok) return
    await apiMutate(`/api/groups/${group._id}`, "DELETE")
    await refetch()
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-emerald-600">Groups</h1>
          <p className="text-muted-foreground">
            Working groups inside a class. Teachers can split a class into groups, or students can
            start their own.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-56">
            <Select value={selectedId ?? undefined} onValueChange={select}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a class" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((c) => (
                  <SelectItem key={c._id} value={c._id}>
                    {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New group
          </Button>
        </div>
      </div>

      <AsyncState
        isLoading={isLoading}
        error={error}
        isEmpty={groups.length === 0}
        emptyMessage="No groups in this class yet — create the first one."
        onRetry={refetch}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {groups.map((group) => {
            const full = group.maxMembers > 0 && group.memberCount >= group.maxMembers
            const canManage = group.isOwner || canModerate

            return (
              <Card key={group._id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="text-lg">{group.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {group.course?.title} · started by {group.createdBy?.name ?? "someone"}
                      </p>
                    </div>
                    <Badge variant={group.joinPolicy === "open" ? "default" : "secondary"}>
                      {group.joinPolicy}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {group.description && (
                    <p className="text-sm text-muted-foreground">{group.description}</p>
                  )}

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    {group.memberCount}
                    {group.maxMembers > 0 ? ` / ${group.maxMembers}` : ""} member
                    {group.memberCount === 1 ? "" : "s"}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {group.members.map((member) => (
                      <div
                        key={member._id}
                        className="flex items-center gap-1 rounded-full border px-2 py-1 text-xs"
                      >
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-[10px]">
                            {initials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                        {member.name ?? "Unknown"}
                        {canManage && (
                          <button
                            type="button"
                            className="ml-1 text-red-600"
                            onClick={() => void removeMember(group, member)}
                            aria-label={`Remove ${member.name ?? "member"}`}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {group.isMember ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === group._id}
                        onClick={() => void membership(group, "leave")}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Leave
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        disabled={busyId === group._id || full || group.joinPolicy === "closed"}
                        onClick={() => void membership(group, "join")}
                      >
                        {busyId === group._id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <UserPlus className="mr-2 h-4 w-4" />
                        )}
                        {full ? "Full" : group.joinPolicy === "closed" ? "Closed" : "Join"}
                      </Button>
                    )}

                    {canManage && (
                      <>
                        <Button size="sm" variant="ghost" onClick={() => openEdit(group)}>
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600"
                          onClick={() => void remove(group)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </AsyncState>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit group" : "New group"}</DialogTitle>
            <DialogDescription>
              An open group can be joined by anyone in the class. A closed one is managed by whoever
              created it.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Reading Group A"
              />
            </div>

            <div className="space-y-2">
              <Label>What&apos;s it for? (optional)</Label>
              <Textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            {!editingId && (
              <div className="space-y-2">
                <Label>Class</Label>
                <Select
                  value={form.course || undefined}
                  onValueChange={(v) => setForm((f) => ({ ...f, course: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a class" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((c) => (
                      <SelectItem key={c._id} value={c._id}>
                        {c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Maximum members</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.maxMembers}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, maxMembers: Number(e.target.value) || 0 }))
                  }
                />
                <p className="text-xs text-muted-foreground">0 = no limit</p>
              </div>
              <div className="space-y-2">
                <Label>Who can join</Label>
                <Select
                  value={form.joinPolicy}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, joinPolicy: v as "open" | "closed" }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Anyone in the class</SelectItem>
                    <SelectItem value="closed">Only people I add</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formError && <p className="text-sm text-red-600">{formError}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={() => void save()} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingId ? "Save changes" : "Create group"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {confirmDialog}
    </div>
  )
}
