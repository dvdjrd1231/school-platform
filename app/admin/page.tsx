"use client"

import Link from "next/link"
import {
  Users,
  GraduationCap,
  BookOpen,
  BarChart3,
  TrendingUp,
  FileText,
  ClipboardCheck,
} from "lucide-react"

import { useApi } from "@/hooks/use-api"
import { AsyncState } from "@/components/ui/async-state"
import { StatTile } from "@/components/admin/stat-tile"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Stats {
  totalStudents: number
  totalTeachers: number
  totalParents: number
  activeCourses: number
  totalCourses: number
  publishedAssignments: number
  pendingGrades: number
  gradedSubmissions: number
  activeEnrollments: number
  averageScorePercent: number | null
}

interface Activity {
  type: "user" | "enrollment" | "assignment" | "grade"
  action: string
  details: string
  at: string
}

const ACTIVITY_ICON = {
  user: Users,
  enrollment: GraduationCap,
  assignment: FileText,
  grade: BarChart3,
} as const

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.round(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.round(hrs / 24)}d ago`
}

export default function AdminDashboard() {
  const statsReq = useApi<Stats>("/api/admin/stats")
  const activityReq = useApi<{ activity: Activity[] }>("/api/admin/activity")
  const s = statsReq.data

  const tiles = [
    { label: "Students", value: s?.totalStudents, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Teachers", value: s?.totalTeachers, icon: GraduationCap, color: "text-green-600", bg: "bg-green-50" },
    { label: "Active Courses", value: s?.activeCourses, icon: BookOpen, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Enrollments", value: s?.activeEnrollments, icon: Users, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Assignments", value: s?.publishedAssignments, icon: FileText, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Awaiting grading", value: s?.pendingGrades, icon: ClipboardCheck, color: "text-red-600", bg: "bg-red-50" },
  ]

  const quickActions = [
    { title: "User Management", href: "/admin/users", icon: Users },
    { title: "Class Management", href: "/admin/classes", icon: GraduationCap },
    { title: "Lesson Management", href: "/admin/lessons", icon: BookOpen },
    { title: "Grade Management", href: "/admin/grades", icon: BarChart3 },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Manage your Maat K12 platform</p>
        </div>
        <Badge variant="outline" className="text-emerald-600 border-emerald-600">
          Administrator
        </Badge>
      </div>

      <AsyncState isLoading={statsReq.isLoading} error={statsReq.error} onRetry={statsReq.refetch}>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {tiles.map((t) => (
            <StatTile key={t.label} {...t} />
          ))}
        </div>
      </AsyncState>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              Recent activity
            </CardTitle>
            <CardDescription>Latest events across the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <AsyncState
              isLoading={activityReq.isLoading}
              error={activityReq.error}
              isEmpty={(activityReq.data?.activity.length ?? 0) === 0}
              emptyMessage="No activity yet."
              onRetry={activityReq.refetch}
            >
              <ul className="space-y-3">
                {activityReq.data?.activity.map((a, i) => {
                  const Icon = ACTIVITY_ICON[a.type]
                  return (
                    <li key={i} className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-full bg-emerald-100 p-1.5">
                        <Icon className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{a.action}</p>
                        <p className="text-sm text-gray-600">{a.details}</p>
                      </div>
                      <span className="text-xs text-gray-400">{timeAgo(a.at)}</span>
                    </li>
                  )
                })}
              </ul>
            </AsyncState>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {quickActions.map((a) => {
                const Icon = a.icon
                return (
                  <Link
                    key={a.href}
                    href={a.href}
                    className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted"
                  >
                    <Icon className="h-5 w-5 text-emerald-600" />
                    <span className="font-medium">{a.title}</span>
                  </Link>
                )
              })}
              {s?.averageScorePercent !== null && s?.averageScorePercent !== undefined && (
                <div className="rounded-lg bg-emerald-50 p-3 text-sm">
                  Platform average grade:{" "}
                  <span className="font-bold text-emerald-700">{s.averageScorePercent}%</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
