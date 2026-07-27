"use client"

import { useMemo, useRef, useState } from "react"
import { Download, FileText, Loader2, Trash2, Upload } from "lucide-react"

import { useApi } from "@/hooks/use-api"
import { apiMutate } from "@/lib/api/client"
import { useCourses } from "@/components/context/course-context"
import { useRole } from "@/components/context/role-context"
import { AsyncState } from "@/components/ui/async-state"
import { useConfirm } from "@/components/ui/confirm-dialog"
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface ReportFile {
  _id: string
  filename: string
  title?: string
  description?: string
  size: number
  createdAt: string
  tags: string[]
  owner?: { _id: string; name?: string } | null
  student?: { _id: string; name?: string } | null
  course?: { _id: string; title: string } | null
}

interface RosterEntry {
  student: { _id: string; name?: string; email?: string }
}

const TERMS = ["Quarter 1", "Quarter 2", "Quarter 3", "Quarter 4", "Mid-year", "End of year"]

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const units = ["KB", "MB", "GB"]
  let value = bytes / 1024
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit++
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unit]}`
}

/**
 * Progress reports and report cards.
 *
 * Teachers upload a document for one student for a given term; the student and
 * their parents can download it whenever they need it. Access comes from the
 * file rules — a report is readable by the student it's about and by their
 * linked guardians, and by nobody else's family.
 */
export default function ReportsPage() {
  const { isTeacher, isAdmin } = useRole()
  const { courses, selectedId, select } = useCourses()
  const isStaff = isTeacher || isAdmin

  const query = new URLSearchParams({ context: "report" })
  if (isStaff && selectedId) query.set("courseId", selectedId)

  const { data, error, isLoading, refetch } = useApi<{ files: ReportFile[] }>(`/api/files?${query}`)
  const reports = data?.files ?? []

  const roster = useApi<{ roster: RosterEntry[] }>(
    isStaff && selectedId ? `/api/courses/${selectedId}/enroll` : null,
  )

  const inputRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<File | null>(null)
  const [form, setForm] = useState({ studentId: "", term: TERMS[0], note: "" })
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const [confirm, confirmDialog] = useConfirm()

  // Students to choose from when filing a report.
  const students = useMemo(
    () => (roster.data?.roster ?? []).map((e) => e.student).filter(Boolean),
    [roster.data],
  )

  const upload = async () => {
    if (!pending) return
    if (!form.studentId) return setUploadError("Choose which student this is for")

    setUploading(true)
    setUploadError("")
    try {
      const body = new FormData()
      body.append("file", pending)
      body.append(
        "meta",
        JSON.stringify({
          context: "report",
          courseId: selectedId || undefined,
          studentId: form.studentId,
          title: `${form.term} report`,
          description: form.note || undefined,
          tags: [form.term],
          visibility: "private",
        }),
      )

      const res = await fetch("/api/files", { method: "POST", body })
      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(payload.error ?? `Upload failed (${res.status})`)
      }

      setPending(null)
      if (inputRef.current) inputRef.current.value = ""
      await refetch()
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  const remove = async (report: ReportFile) => {
    const ok = await confirm({
      title: "Delete this report?",
      description: `"${report.title ?? report.filename}" will be permanently removed, including for the family. This cannot be undone.`,
    })
    if (!ok) return
    await apiMutate(`/api/files/${report._id}`, "DELETE")
    await refetch()
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-emerald-600">Progress reports</h1>
          <p className="text-muted-foreground">
            {isStaff
              ? "Upload a report card or progress report for a student each term."
              : "Download your reports whenever you need them."}
          </p>
        </div>

        {isStaff && (
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
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,image/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  setPending(file)
                  setUploadError("")
                }
              }}
            />
            <Button onClick={() => inputRef.current?.click()} disabled={!selectedId}>
              <Upload className="mr-2 h-4 w-4" />
              Upload report
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-5 w-5" />
            {isStaff ? "Reports you've filed" : "Your reports"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AsyncState
            isLoading={isLoading}
            error={error}
            isEmpty={reports.length === 0}
            emptyMessage={
              isStaff
                ? "No reports filed for this class yet."
                : "No reports have been shared with you yet."
            }
            onRetry={refetch}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Filed</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report._id}>
                    <TableCell>
                      <div className="font-medium">{report.title ?? report.filename}</div>
                      <div className="text-xs text-muted-foreground">
                        {report.filename} · {formatBytes(report.size)}
                      </div>
                      {report.description && (
                        <div className="text-xs text-muted-foreground">{report.description}</div>
                      )}
                    </TableCell>
                    <TableCell>{report.student?.name ?? "—"}</TableCell>
                    <TableCell>{report.course?.title ?? "—"}</TableCell>
                    <TableCell>
                      <div>
                        {new Date(report.createdAt).toLocaleDateString(undefined, {
                          dateStyle: "medium",
                        })}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        by {report.owner?.name ?? "staff"}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {report.tags[0] && <Badge variant="outline">{report.tags[0]}</Badge>}
                        <Button variant="outline" size="sm" asChild>
                          <a href={`/api/files/${report._id}/download`}>
                            <Download className="mr-1 h-3.5 w-3.5" />
                            Download
                          </a>
                        </Button>
                        {isStaff && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-600"
                            onClick={() => void remove(report)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AsyncState>
        </CardContent>
      </Card>

      <Dialog open={pending !== null} onOpenChange={(open) => !open && !uploading && setPending(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>File a report</DialogTitle>
            <DialogDescription>
              {pending?.name} — only this student and their linked parents will be able to see it.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Student</Label>
              <Select
                value={form.studentId || undefined}
                onValueChange={(v) => setForm((f) => ({ ...f, studentId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student._id} value={student._id}>
                      {student.name ?? student.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {students.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Nobody is enrolled in this class yet.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Term</Label>
              <Select value={form.term} onValueChange={(v) => setForm((f) => ({ ...f, term: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TERMS.map((term) => (
                    <SelectItem key={term} value={term}>
                      {term}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Note for the family (optional)</Label>
              <Textarea
                rows={3}
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              />
            </div>

            {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPending(null)} disabled={uploading}>
              Cancel
            </Button>
            <Button onClick={() => void upload()} disabled={uploading}>
              {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {confirmDialog}
    </div>
  )
}
