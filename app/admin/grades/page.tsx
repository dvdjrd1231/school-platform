"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"

import { useApi } from "@/hooks/use-api"
import { AsyncState } from "@/components/ui/async-state"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface GradeRow {
  submissionId: string
  student: string
  studentId: string | null
  courseCode: string
  courseTitle: string
  assignment: string
  category: string
  score: number | null
  points: number
  percent: number | null
  isLate: boolean
  gradedAt: string | null
}

interface GradeResponse {
  rows: GradeRow[]
  courses: { _id: string; code: string; title: string }[]
  summary: { total: number; average: number | null }
}

function gradeColor(percent: number | null): string {
  if (percent === null) return "bg-gray-100 text-gray-700"
  if (percent >= 80) return "bg-green-100 text-green-800"
  if (percent >= 70) return "bg-yellow-100 text-yellow-800"
  if (percent >= 60) return "bg-orange-100 text-orange-800"
  return "bg-red-100 text-red-800"
}

export default function GradeManagement() {
  const [search, setSearch] = useState("")
  const [courseFilter, setCourseFilter] = useState("all")

  const url = courseFilter === "all" ? "/api/admin/grades" : `/api/admin/grades?courseId=${courseFilter}`
  const { data, error, isLoading, refetch } = useApi<GradeResponse>(url)

  const rows = useMemo(() => data?.rows ?? [], [data])
  const courses = data?.courses ?? []

  const filtered = rows.filter((r) => {
    const term = search.toLowerCase()
    return (
      r.student.toLowerCase().includes(term) ||
      r.assignment.toLowerCase().includes(term) ||
      r.courseCode.toLowerCase().includes(term)
    )
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Grade Management</h1>
        <p className="text-gray-600">Every graded submission across the school</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Graded submissions</p>
            <p className="text-2xl font-bold text-emerald-600">{data?.summary.total ?? "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Average grade</p>
            <p className="text-2xl font-bold text-emerald-600">
              {data?.summary.average !== null && data?.summary.average !== undefined
                ? `${data.summary.average}%`
                : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Courses</p>
            <p className="text-2xl font-bold text-emerald-600">{courses.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by student, assignment, or class..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={courseFilter} onValueChange={setCourseFilter}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All courses</SelectItem>
            {courses.map((c) => (
              <SelectItem key={c._id} value={c._id}>
                {c.code} — {c.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gradebook ({filtered.length})</CardTitle>
          <CardDescription>Sorted by most recently graded</CardDescription>
        </CardHeader>
        <CardContent>
          <AsyncState
            isLoading={isLoading}
            error={error}
            isEmpty={filtered.length === 0}
            emptyMessage="No grades recorded yet."
            onRetry={refetch}
          >
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Assignment</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Graded</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r.submissionId}>
                      <TableCell>
                        <div className="font-medium">{r.student}</div>
                        {r.studentId && (
                          <div className="text-xs text-muted-foreground">{r.studentId}</div>
                        )}
                      </TableCell>
                      <TableCell>{r.courseCode}</TableCell>
                      <TableCell>
                        {r.assignment}
                        {r.isLate && <Badge className="ml-2 bg-red-100 text-red-800">Late</Badge>}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {r.score ?? "—"}/{r.points}
                      </TableCell>
                      <TableCell>
                        <Badge className={gradeColor(r.percent)}>
                          {r.percent !== null ? `${r.percent}%` : "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {r.gradedAt ? new Date(r.gradedAt).toLocaleDateString() : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </AsyncState>
        </CardContent>
      </Card>
    </div>
  )
}
