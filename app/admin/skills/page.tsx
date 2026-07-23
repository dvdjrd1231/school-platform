"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Loader2, Target, GraduationCap, Layers } from "lucide-react"

import { useRole } from "@/components/context/role-context"
import { useApi } from "@/hooks/use-api"
import { apiMutate } from "@/lib/api/client"
import { AsyncState } from "@/components/ui/async-state"
import { StatTile } from "@/components/admin/stat-tile"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface Skill {
  _id: string
  name: string
  category: string
  subject?: string
  gradeLevel: string
  standardCode?: string
  framework?: string
  description?: string
  order?: number
}

const EMPTY = {
  name: "",
  category: "",
  subject: "",
  gradeLevel: "",
  standardCode: "",
  framework: "",
  description: "",
}

export default function SkillsAdminPage() {
  const { isAdmin, isTeacher, isLoading: rolesLoading } = useRole()
  const canManage = isAdmin || isTeacher
  const router = useRouter()

  const [search, setSearch] = useState("")
  const [gradeFilter, setGradeFilter] = useState("all")
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [formError, setFormError] = useState("")
  const [saving, setSaving] = useState(false)

  const skillsReq = useApi<{ skills: Skill[]; gradeLevels: string[] }>(canManage ? "/api/skills" : null)
  const skills = useMemo(() => skillsReq.data?.skills ?? [], [skillsReq.data])
  const gradeLevels = skillsReq.data?.gradeLevels ?? []

  const filtered = skills.filter((s) => {
    const term = search.toLowerCase()
    const matchSearch =
      s.name.toLowerCase().includes(term) ||
      s.category.toLowerCase().includes(term) ||
      (s.standardCode ?? "").toLowerCase().includes(term)
    const matchGrade = gradeFilter === "all" || s.gradeLevel === gradeFilter
    return matchSearch && matchGrade
  })

  const stats = useMemo(
    () => ({
      total: skills.length,
      grades: new Set(skills.map((s) => s.gradeLevel)).size,
      categories: new Set(skills.map((s) => s.category)).size,
    }),
    [skills],
  )

  if (!rolesLoading && !canManage) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-gray-600 mb-6">Only staff can manage the skills catalog.</p>
        <Button onClick={() => router.push("/")}>Back to Home</Button>
      </div>
    )
  }

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }))

  const openCreate = () => {
    setEditingId(null)
    setForm(EMPTY)
    setFormError("")
    setOpen(true)
  }

  const openEdit = (s: Skill) => {
    setEditingId(s._id)
    setForm({
      name: s.name,
      category: s.category,
      subject: s.subject ?? "",
      gradeLevel: s.gradeLevel,
      standardCode: s.standardCode ?? "",
      framework: s.framework ?? "",
      description: s.description ?? "",
    })
    setFormError("")
    setOpen(true)
  }

  const save = async () => {
    setFormError("")
    if (form.name.trim().length < 2) return setFormError("Name is required")
    if (!form.category.trim()) return setFormError("Category is required")
    if (!form.gradeLevel.trim()) return setFormError("Grade level is required")

    const payload = {
      name: form.name.trim(),
      category: form.category.trim(),
      subject: form.subject.trim() || undefined,
      gradeLevel: form.gradeLevel.trim(),
      standardCode: form.standardCode.trim() || undefined,
      framework: form.framework.trim() || undefined,
      description: form.description.trim() || undefined,
    }

    setSaving(true)
    try {
      if (editingId) await apiMutate(`/api/skills/${editingId}`, "PATCH", payload)
      else await apiMutate("/api/skills", "POST", payload)
      setOpen(false)
      setForm(EMPTY)
      setEditingId(null)
      await skillsReq.refetch()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not save the skill")
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: string) => {
    await apiMutate(`/api/skills/${id}`, "DELETE").catch(() => {})
    await skillsReq.refetch()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Skills &amp; Standards</h1>
          <p className="text-gray-600">Define the grade-level standards students are assessed against</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditingId(null) }}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Add Standard
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit standard" : "Add a standard"}</DialogTitle>
              <DialogDescription>A skill or competency scoped to a grade level.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>Name</Label>
                <Input placeholder="Solve quadratic equations" value={form.name} onChange={(e) => set("name", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Grade level</Label>
                <Input placeholder="10th" value={form.gradeLevel} onChange={(e) => set("gradeLevel", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Input placeholder="Mathematics" value={form.category} onChange={(e) => set("category", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Standard code</Label>
                <Input placeholder="CCSS.MATH.HSA.REI.B.4" value={form.standardCode} onChange={(e) => set("standardCode", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Framework</Label>
                <Input placeholder="Common Core" value={form.framework} onChange={(e) => set("framework", e.target.value)} />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Description</Label>
                <Textarea rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} />
              </div>
            </div>
            {formError && <p className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-600">{formError}</p>}
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
              <Button onClick={save} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                {editingId ? "Save changes" : "Add"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatTile label="Standards" value={stats.total} icon={Target} color="text-emerald-600" bg="bg-emerald-50" />
        <StatTile label="Grade Levels" value={stats.grades} icon={GraduationCap} color="text-blue-600" bg="bg-blue-50" />
        <StatTile label="Categories" value={stats.categories} icon={Layers} color="text-purple-600" bg="bg-purple-50" />
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search standards..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={gradeFilter} onValueChange={setGradeFilter}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All grades</SelectItem>
            {gradeLevels.map((g) => (
              <SelectItem key={g} value={g}>
                Grade {g}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Standards ({filtered.length})</CardTitle>
          <CardDescription>Students are assessed against these on the Skills Report</CardDescription>
        </CardHeader>
        <CardContent>
          <AsyncState
            isLoading={skillsReq.isLoading}
            error={skillsReq.error}
            isEmpty={filtered.length === 0}
            emptyMessage="No standards yet. Add one to get started."
            onRetry={skillsReq.refetch}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Standard</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => (
                  <TableRow key={s._id}>
                    <TableCell>
                      <div className="font-medium">{s.name}</div>
                      {s.description && (
                        <div className="text-xs text-muted-foreground line-clamp-1">{s.description}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{s.gradeLevel}</Badge>
                    </TableCell>
                    <TableCell>{s.category}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {s.standardCode ?? "—"}
                      {s.framework ? <div className="text-xs">{s.framework}</div> : null}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(s)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => void remove(s._id)}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AsyncState>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        To record a student&apos;s proficiency, open the{" "}
        <button className="text-emerald-600 underline" onClick={() => router.push("/campus/studies/skills-report")}>
          Skills Report
        </button>{" "}
        and set each level.
      </p>
    </div>
  )
}
