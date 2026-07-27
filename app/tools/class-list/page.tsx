"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { BarChart3, Download, Mail, Search, Users } from "lucide-react"

import { useApi } from "@/hooks/use-api"
import { apiMutate } from "@/lib/api/client"
import { useCourses } from "@/components/context/course-context"
import { useRole } from "@/components/context/role-context"
import { AsyncState } from "@/components/ui/async-state"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface RosterEntry {
  _id: string
  status: string
  progress: number
  enrolledAt: string
  student: {
    _id: string
    name?: string
    email?: string
    avatar?: string
    studentId?: string
    gradeLevel?: string
  }
}

function initials(name?: string): string {
  if (!name) return "?"
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("")
}

/**
 * The class list: who is in a class, and how to reach them.
 *
 * The client asked what this screen was for, because it showed sample names and
 * nothing else. It's the roster — every enrolled student with their ID, grade
 * level, enrolment date and status — with a link to each student's progress
 * summary, a one-click message, and a CSV export, which is what people usually
 * want a class list for.
 */
export default function ClassListPage() {
  const router = useRouter()
  const { isTeacher, isAdmin } = useRole()
  const { courses, selectedId, select, isLoading: coursesLoading } = useCourses()
  const isStaff = isTeacher || isAdmin

  const { data, error, isLoading, refetch } = useApi<{ roster: RosterEntry[]; total: number }>(
    isStaff && selectedId ? `/api/courses/${selectedId}/enroll` : null,
  )

  const [search, setSearch] = useState("")
  const [messaging, setMessaging] = useState<string | null>(null)

  const roster = useMemo(() => {
    const all = data?.roster ?? []
    const q = search.trim().toLowerCase()
    if (!q) return all
    return all.filter(
      (entry) =>
        (entry.student?.name ?? "").toLowerCase().includes(q) ||
        (entry.student?.email ?? "").toLowerCase().includes(q) ||
        (entry.student?.studentId ?? "").toLowerCase().includes(q),
    )
  }, [data, search])

  const message = async (studentId: string) => {
    setMessaging(studentId)
    try {
      const conversation = await apiMutate<{ _id: string }>("/api/conversations", "POST", {
        participantIds: [studentId],
      })
      router.push(`/messages/${conversation._id}`)
    } catch {
      // The conversation may already exist under another id; the inbox is a
      // better landing place than an error.
      router.push("/messages")
    } finally {
      setMessaging(null)
    }
  }

  const exportCsv = () => {
    const header = ["Name", "Email", "Student ID", "Grade level", "Status", "Progress %", "Enrolled"]
    const lines = roster.map((entry) =>
      [
        entry.student?.name ?? "",
        entry.student?.email ?? "",
        entry.student?.studentId ?? "",
        entry.student?.gradeLevel ?? "",
        entry.status,
        String(entry.progress ?? 0),
        new Date(entry.enrolledAt).toISOString().slice(0, 10),
      ]
        // Quote every field and escape inner quotes — names contain commas.
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(","),
    )

    const blob = new Blob([[header.join(","), ...lines].join("\n")], {
      type: "text/csv;charset=utf-8",
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `class-list-${selectedId}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (!isStaff) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            Class lists are for teachers and administrators.
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-emerald-600">Class list</h1>
          <p className="text-muted-foreground">
            Everyone enrolled in a class, with their details. Click a student to open their progress
            summary.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-56">
            <Select value={selectedId ?? undefined} onValueChange={select}>
              <SelectTrigger>
                <SelectValue placeholder={coursesLoading ? "Loading…" : "Choose a class"} />
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
          <Button variant="outline" onClick={exportCsv} disabled={roster.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {!selectedId ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            Choose a class to see its roster.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-5 w-5" />
                {data?.total ?? 0} enrolled
              </CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search this class…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <AsyncState
              isLoading={isLoading}
              error={error}
              isEmpty={roster.length === 0}
              emptyMessage={
                search
                  ? "Nobody matches that search."
                  : "Nobody is enrolled yet — add students from Class Management."
              }
              onRetry={refetch}
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Grade level</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Enrolled</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roster.map((entry) => (
                    <TableRow key={entry._id}>
                      <TableCell>
                        <button
                          type="button"
                          className="flex items-center gap-3 text-left"
                          onClick={() =>
                            router.push(`/performance?studentId=${entry.student?._id}`)
                          }
                        >
                          <Avatar className="h-8 w-8">
                            {entry.student?.avatar && (
                              <AvatarImage
                                src={entry.student.avatar}
                                alt={entry.student.name ?? ""}
                              />
                            )}
                            <AvatarFallback className="text-xs">
                              {initials(entry.student?.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium hover:text-emerald-600 hover:underline">
                              {entry.student?.name ?? "Unknown"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {entry.student?.email}
                            </div>
                          </div>
                        </button>
                      </TableCell>
                      <TableCell className="text-sm">{entry.student?.studentId ?? "—"}</TableCell>
                      <TableCell className="text-sm">{entry.student?.gradeLevel ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant={entry.status === "active" ? "default" : "secondary"}>
                          {entry.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(entry.enrolledAt).toLocaleDateString(undefined, {
                          dateStyle: "medium",
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              router.push(`/performance?studentId=${entry.student?._id}`)
                            }
                          >
                            <BarChart3 className="mr-1 h-3.5 w-3.5" />
                            Progress
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={messaging === entry.student?._id}
                            onClick={() => entry.student && void message(entry.student._id)}
                          >
                            <Mail className="mr-1 h-3.5 w-3.5" />
                            Message
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </AsyncState>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
