"use client"

import { useEffect, useState } from "react"
import { CalendarCheck, Info, Loader2 } from "lucide-react"

import { useApi } from "@/hooks/use-api"
import { apiMutate } from "@/lib/api/client"
import { useCourses } from "@/components/context/course-context"
import { AsyncState } from "@/components/ui/async-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type Status = "present" | "absent" | "late" | "excused"

interface RegisterRow {
  student: { _id: string; name?: string; email?: string }
  status: Status | null
  note: string
  hasSubmitted: boolean
}

interface SummaryRow {
  student: { _id: string; name?: string; email?: string }
  present: number
  recorded: number
  hasSubmitted: boolean
  rate: number | null
}

const STATUSES: Status[] = ["present", "absent", "late", "excused"]

const STATUS_STYLE: Record<Status, string> = {
  present: "bg-green-100 text-green-800",
  absent: "bg-red-100 text-red-800",
  late: "bg-amber-100 text-amber-800",
  excused: "bg-blue-100 text-blue-800",
}

function today(): string {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}

/**
 * Taking and reviewing attendance.
 *
 * The client asked both how attendance is taken and where it's viewed: the
 * register tab is where a teacher marks a day, the record tab is the running
 * total per student.
 *
 * Their rule that attendance should only count once a student has submitted at
 * least one piece of work is applied to the *rate*: a student with nothing
 * handed in shows "—" rather than 0%, since a zero there would read as terrible
 * attendance when it really means "no data yet".
 */
export default function AttendancePage() {
  const { courses, selectedId, select } = useCourses()
  const [date, setDate] = useState(today())
  const [marks, setMarks] = useState<Record<string, { status: Status; note: string }>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState("")

  const register = useApi<{ date: string; register: RegisterRow[] }>(
    selectedId ? `/api/attendance?courseId=${selectedId}&date=${date}` : null,
  )
  const summary = useApi<{ students: SummaryRow[] }>(
    selectedId ? `/api/attendance?courseId=${selectedId}&summary=1` : null,
  )

  // Seed the form from whatever is already recorded for the chosen day.
  useEffect(() => {
    const rows = register.data?.register
    if (!rows) return
    const seeded: Record<string, { status: Status; note: string }> = {}
    for (const row of rows) {
      if (row.status) seeded[row.student._id] = { status: row.status, note: row.note }
    }
    setMarks(seeded)
    setSaved(false)
  }, [register.data])

  const setStatus = (studentId: string, status: Status) =>
    setMarks((m) => ({ ...m, [studentId]: { status, note: m[studentId]?.note ?? "" } }))

  const markAll = (status: Status) => {
    const rows = register.data?.register ?? []
    setMarks((m) => {
      const next = { ...m }
      for (const row of rows) {
        next[row.student._id] = { status, note: next[row.student._id]?.note ?? "" }
      }
      return next
    })
  }

  const save = async () => {
    const entries = Object.entries(marks)
    if (entries.length === 0) return

    setSaving(true)
    setSaveError("")
    try {
      await apiMutate("/api/attendance", "POST", {
        courseId: selectedId,
        date: new Date(`${date}T12:00:00`).toISOString(),
        marks: entries.map(([student, value]) => ({
          student,
          status: value.status,
          note: value.note || undefined,
        })),
      })
      setSaved(true)
      await Promise.all([register.refetch(), summary.refetch()])
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not save attendance")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attendance</h1>
          <p className="text-gray-600">Take the register and review each student&apos;s record.</p>
        </div>
        <div className="w-64">
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
      </div>

      {!selectedId ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            Choose a class to take its register.
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="register">
          <TabsList>
            <TabsTrigger value="register">Take the register</TabsTrigger>
            <TabsTrigger value="record">Attendance record</TabsTrigger>
          </TabsList>

          <TabsContent value="register" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="attendance-date">Date</Label>
                    <Input
                      id="attendance-date"
                      type="date"
                      className="w-48"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => markAll("present")}>
                      Mark all present
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => markAll("absent")}>
                      Mark all absent
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <AsyncState
                  isLoading={register.isLoading}
                  error={register.error}
                  isEmpty={(register.data?.register ?? []).length === 0}
                  emptyMessage="Nobody is enrolled in this class yet."
                  onRetry={register.refetch}
                >
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Mark</TableHead>
                        <TableHead>Note</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(register.data?.register ?? []).map((row) => (
                        <TableRow key={row.student._id}>
                          <TableCell>
                            <div className="font-medium">{row.student.name ?? "Unknown"}</div>
                            <div className="text-xs text-muted-foreground">
                              {row.student.email}
                              {!row.hasSubmitted && " · no work handed in yet"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {STATUSES.map((status) => {
                                const active = marks[row.student._id]?.status === status
                                return (
                                  <button
                                    type="button"
                                    key={status}
                                    onClick={() => setStatus(row.student._id, status)}
                                    className={`rounded px-2 py-1 text-xs capitalize transition-colors ${
                                      active
                                        ? STATUS_STYLE[status]
                                        : "bg-muted text-muted-foreground hover:bg-muted/70"
                                    }`}
                                  >
                                    {status}
                                  </button>
                                )
                              })}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Input
                              className="h-8"
                              placeholder="Optional"
                              value={marks[row.student._id]?.note ?? ""}
                              onChange={(e) =>
                                setMarks((m) => ({
                                  ...m,
                                  [row.student._id]: {
                                    status: m[row.student._id]?.status ?? "present",
                                    note: e.target.value,
                                  },
                                }))
                              }
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </AsyncState>

                {saveError && <p className="mt-3 text-sm text-red-600">{saveError}</p>}

                <div className="mt-4 flex items-center gap-3">
                  <Button onClick={() => void save()} disabled={saving || Object.keys(marks).length === 0}>
                    {saving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CalendarCheck className="mr-2 h-4 w-4" />
                    )}
                    Save register
                  </Button>
                  {saved && <span className="text-sm text-green-700">Saved.</span>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="record" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Attendance record</CardTitle>
                <p className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Info className="mt-0.5 h-4 w-4 shrink-0" />
                  A rate is only shown once a student has handed at least one piece of work in.
                  Excused absences are left out of the calculation; late still counts as attending.
                </p>
              </CardHeader>
              <CardContent>
                <AsyncState
                  isLoading={summary.isLoading}
                  error={summary.error}
                  isEmpty={(summary.data?.students ?? []).length === 0}
                  emptyMessage="Nobody is enrolled in this class yet."
                  onRetry={summary.refetch}
                >
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Days recorded</TableHead>
                        <TableHead>Attended</TableHead>
                        <TableHead>Rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(summary.data?.students ?? []).map((row) => (
                        <TableRow key={row.student._id}>
                          <TableCell className="font-medium">
                            {row.student.name ?? "Unknown"}
                          </TableCell>
                          <TableCell>{row.recorded}</TableCell>
                          <TableCell>{row.present}</TableCell>
                          <TableCell>
                            {row.rate === null ? (
                              <Badge variant="outline">
                                {row.hasSubmitted ? "Not recorded yet" : "No work handed in"}
                              </Badge>
                            ) : (
                              <span
                                className={
                                  row.rate >= 90
                                    ? "text-green-700"
                                    : row.rate >= 75
                                      ? "text-amber-700"
                                      : "text-red-700"
                                }
                              >
                                {row.rate}%
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </AsyncState>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
