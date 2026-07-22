"use client"

import { useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Download, Minus, TrendingDown, TrendingUp } from "lucide-react"

import { useApi } from "@/hooks/use-api"
import { AsyncState } from "@/components/ui/async-state"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface PerformanceReport {
  studentId: string
  generatedAt: string
  overall: {
    percent: number | null
    letter: string | null
    gpa: number | null
    trend: { direction: "improving" | "declining" | "steady"; changePercent: number }
  }
  courses: {
    courseId: string
    courseTitle: string
    courseCode: string
    subject: string
    percent: number | null
    letter: string | null
    gradedCount: number
    pendingCount: number
    missingCount: number
  }[]
  timeline: { date: string; percent: number; assignment: string; course: string }[]
  categoryBreakdown: { category: string; percent: number; count: number }[]
  attendanceProxy: { onTime: number; late: number; missing: number }
}

interface PickerUser {
  _id: string
  name: string
  email: string
  studentId?: string
}

/** Status thresholds. Colour never carries meaning alone — always with a label. */
function standing(percent: number | null): { label: string; token: string } {
  if (percent === null) return { label: "No grades", token: "var(--viz-muted)" }
  if (percent >= 80) return { label: "On track", token: "var(--viz-good)" }
  if (percent >= 70) return { label: "Watch", token: "var(--viz-warning)" }
  if (percent >= 60) return { label: "At risk", token: "var(--viz-serious)" }
  return { label: "Critical", token: "var(--viz-critical)" }
}

export default function PerformancePage() {
  const { data: session } = useSession()
  const me = session?.user
  const roles = me?.roles ?? []
  const isStaff = roles.includes("teacher") || roles.includes("admin")
  const isParent = roles.includes("parent")

  const [studentId, setStudentId] = useState<string>("")

  // Staff choose any student; parents choose among their own children.
  const staffList = useApi<{ users: PickerUser[] }>(isStaff ? "/api/users?role=student&limit=100" : null)
  const parentSelf = useApi<{ children?: PickerUser[] }>(isParent && me?.id ? `/api/users/${me.id}` : null)

  const options: PickerUser[] = useMemo(() => {
    if (isStaff) return staffList.data?.users ?? []
    if (isParent) return parentSelf.data?.children ?? []
    return []
  }, [isStaff, isParent, staffList.data, parentSelf.data])

  // Students look at themselves; everyone else defaults to the first option.
  useEffect(() => {
    if (studentId) return
    if (!isStaff && !isParent && me?.id) setStudentId(me.id)
    else if (options.length > 0) setStudentId(options[0]._id)
  }, [isStaff, isParent, me?.id, options, studentId])

  const report = useApi<PerformanceReport>(studentId ? `/api/performance/${studentId}` : null)
  const data = report.data

  const trendData = useMemo(
    () =>
      (data?.timeline ?? []).map((t) => ({
        ...t,
        label: new Date(t.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      })),
    [data?.timeline],
  )

  const courseData = useMemo(
    () =>
      (data?.courses ?? [])
        .filter((c) => c.percent !== null)
        .map((c) => ({ name: c.courseCode, percent: c.percent as number, title: c.courseTitle })),
    [data?.courses],
  )

  const categoryData = useMemo(
    () =>
      (data?.categoryBreakdown ?? []).map((c) => ({
        name: c.category.charAt(0).toUpperCase() + c.category.slice(1),
        percent: c.percent,
        count: c.count,
      })),
    [data?.categoryBreakdown],
  )

  const TrendIcon =
    data?.overall.trend.direction === "improving"
      ? TrendingUp
      : data?.overall.trend.direction === "declining"
        ? TrendingDown
        : Minus

  return (
    <div className="perf-viz container mx-auto p-6 space-y-6">
      {/*
        Chart chrome is theme-aware; the series colour (#059669) is validated
        against BOTH the light and dark surfaces, so it needs no variant.
      */}
      <style>{`
        .perf-viz {
          --viz-series:   #059669;
          --viz-grid:     #e1e0d9;
          --viz-axis:     #c3c2b7;
          --viz-muted:    #898781;
          --viz-good:     #0ca30c;
          --viz-warning:  #fab219;
          --viz-serious:  #ec835a;
          --viz-critical: #d03b3b;
        }
        .dark .perf-viz {
          --viz-grid: #2c2c2a;
          --viz-axis: #383835;
        }
      `}</style>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-emerald-600">Performance</h1>
          <p className="text-muted-foreground">Grades, trends, and progress across courses.</p>
        </div>

        <div className="flex items-center gap-2">
          {(isStaff || isParent) && options.length > 0 && (
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Select a student" />
              </SelectTrigger>
              <SelectContent>
                {options.map((u) => (
                  <SelectItem key={u._id} value={u._id}>
                    {u.name}
                    {u.studentId ? ` (${u.studentId})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {studentId && (
            <Button variant="outline" asChild>
              {/* Server renders the CSV; a plain link keeps the download native. */}
              <a href={`/api/performance/${studentId}?format=csv`} download>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </a>
            </Button>
          )}
        </div>
      </div>

      {isParent && options.length === 0 && !parentSelf.isLoading && (
        <p className="rounded border bg-muted/40 p-4 text-sm text-muted-foreground">
          No students are linked to your account yet. An administrator can link your children from
          the user management page.
        </p>
      )}

      <AsyncState
        isLoading={report.isLoading}
        error={report.error}
        isEmpty={!data}
        emptyMessage="Select a student to see their performance."
        onRetry={report.refetch}
      >
        {data && (
          <>
            {/* Headline figures — a stat tile, not a chart, is the right form here. */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Overall</p>
                  <p className="text-3xl font-bold">
                    {data.overall.percent !== null ? `${data.overall.percent}%` : "—"}
                  </p>
                  {data.overall.letter && (
                    <p className="text-sm text-muted-foreground">Grade {data.overall.letter}</p>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">GPA (4.0)</p>
                  <p className="text-3xl font-bold">{data.overall.gpa ?? "—"}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Trend</p>
                  <p className="flex items-center gap-2 text-3xl font-bold">
                    <TrendIcon className="h-6 w-6" aria-hidden />
                    {data.overall.trend.changePercent > 0 ? "+" : ""}
                    {data.overall.trend.changePercent}
                  </p>
                  {/* Icon + word, never colour alone. */}
                  <p className="text-sm capitalize text-muted-foreground">
                    {data.overall.trend.direction}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Submissions</p>
                  <p className="text-3xl font-bold tabular-nums">
                    {data.attendanceProxy.onTime}
                    <span className="text-base font-normal text-muted-foreground">
                      {" "}
                      on time
                    </span>
                  </p>
                  <p className="text-sm text-muted-foreground tabular-nums">
                    {data.attendanceProxy.late} late · {data.attendanceProxy.missing} missing
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Change over time → line. Single series, so the title names it: no legend. */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Graded results over time (%)</CardTitle>
              </CardHeader>
              <CardContent>
                {trendData.length < 2 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Not enough graded work yet to show a trend.
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={trendData} margin={{ top: 8, right: 16, bottom: 4, left: -8 }}>
                      <CartesianGrid stroke="var(--viz-grid)" vertical={false} />
                      <XAxis
                        dataKey="label"
                        tick={{ fill: "var(--viz-muted)", fontSize: 12 }}
                        tickLine={false}
                        axisLine={{ stroke: "var(--viz-axis)" }}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fill: "var(--viz-muted)", fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        width={44}
                      />
                      <Tooltip
                        cursor={{ stroke: "var(--viz-axis)", strokeWidth: 1 }}
                        contentStyle={{
                          borderRadius: 8,
                          border: "1px solid rgba(11,11,11,0.10)",
                          fontSize: 12,
                        }}
                        formatter={(v: number) => [`${v}%`, "Score"]}
                        labelFormatter={(_l, p) => {
                          const d = p?.[0]?.payload
                          return d ? `${d.assignment} · ${d.course}` : ""
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="percent"
                        stroke="var(--viz-series)"
                        strokeWidth={2}
                        dot={{ r: 4, fill: "var(--viz-series)", strokeWidth: 0 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Magnitude by identity → bars. Identity is on the axis, so one colour. */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Grade by course (%)</CardTitle>
                </CardHeader>
                <CardContent>
                  {courseData.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">No graded courses yet.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={Math.max(160, courseData.length * 48)}>
                      <BarChart
                        data={courseData}
                        layout="vertical"
                        margin={{ top: 4, right: 40, bottom: 4, left: 8 }}
                      >
                        <CartesianGrid stroke="var(--viz-grid)" horizontal={false} />
                        <XAxis
                          type="number"
                          domain={[0, 100]}
                          tick={{ fill: "var(--viz-muted)", fontSize: 12 }}
                          tickLine={false}
                          axisLine={{ stroke: "var(--viz-axis)" }}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          tick={{ fill: "var(--viz-muted)", fontSize: 12 }}
                          tickLine={false}
                          axisLine={false}
                          width={72}
                        />
                        <Tooltip
                          cursor={{ fill: "var(--viz-grid)", fillOpacity: 0.4 }}
                          contentStyle={{
                            borderRadius: 8,
                            border: "1px solid rgba(11,11,11,0.10)",
                            fontSize: 12,
                          }}
                          formatter={(v: number) => [`${v}%`, "Grade"]}
                          labelFormatter={(_l, p) => p?.[0]?.payload?.title ?? ""}
                        />
                        {/* 4px rounded data-end, anchored to the baseline. */}
                        <Bar dataKey="percent" fill="var(--viz-series)" radius={[0, 4, 4, 0]} barSize={18} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Average by assignment type (%)</CardTitle>
                </CardHeader>
                <CardContent>
                  {categoryData.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">No graded work yet.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={Math.max(160, categoryData.length * 48)}>
                      <BarChart
                        data={categoryData}
                        layout="vertical"
                        margin={{ top: 4, right: 40, bottom: 4, left: 8 }}
                      >
                        <CartesianGrid stroke="var(--viz-grid)" horizontal={false} />
                        <XAxis
                          type="number"
                          domain={[0, 100]}
                          tick={{ fill: "var(--viz-muted)", fontSize: 12 }}
                          tickLine={false}
                          axisLine={{ stroke: "var(--viz-axis)" }}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          tick={{ fill: "var(--viz-muted)", fontSize: 12 }}
                          tickLine={false}
                          axisLine={false}
                          width={92}
                        />
                        <Tooltip
                          cursor={{ fill: "var(--viz-grid)", fillOpacity: 0.4 }}
                          contentStyle={{
                            borderRadius: 8,
                            border: "1px solid rgba(11,11,11,0.10)",
                            fontSize: 12,
                          }}
                          formatter={(v: number, _n, p) => [`${v}%`, `${p?.payload?.count ?? 0} graded`]}
                        />
                        <Bar dataKey="percent" fill="var(--viz-series)" radius={[0, 4, 4, 0]} barSize={18} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* The table view: the same data without relying on colour or hover. */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Course detail</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Course</TableHead>
                        <TableHead>Grade</TableHead>
                        <TableHead>Standing</TableHead>
                        <TableHead className="text-right">Graded</TableHead>
                        <TableHead className="text-right">Pending</TableHead>
                        <TableHead className="text-right">Missing</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.courses.map((c) => {
                        const s = standing(c.percent)
                        return (
                          <TableRow key={c.courseId}>
                            <TableCell>
                              <div className="font-medium">{c.courseTitle}</div>
                              <div className="text-xs text-muted-foreground">{c.courseCode}</div>
                            </TableCell>
                            <TableCell className="tabular-nums">
                              {c.percent !== null ? `${c.percent}%` : "—"}
                              {c.letter && (
                                <span className="ml-2 text-muted-foreground">{c.letter}</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <span className="flex items-center gap-2">
                                <span
                                  aria-hidden
                                  className="inline-block h-2 w-2 rounded-full"
                                  style={{ backgroundColor: s.token }}
                                />
                                {s.label}
                              </span>
                            </TableCell>
                            <TableCell className="text-right tabular-nums">{c.gradedCount}</TableCell>
                            <TableCell className="text-right tabular-nums">{c.pendingCount}</TableCell>
                            <TableCell className="text-right tabular-nums">
                              {c.missingCount > 0 ? (
                                <Badge className="bg-red-100 text-red-800">{c.missingCount}</Badge>
                              ) : (
                                0
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </AsyncState>
    </div>
  )
}
