"use client"

import { useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { Target, Award, Loader2 } from "lucide-react"

import { useApi } from "@/hooks/use-api"
import { apiMutate } from "@/lib/api/client"
import { AsyncState } from "@/components/ui/async-state"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const LEVELS = ["not-assessed", "developing", "proficient", "advanced", "mastered"] as const
type Level = (typeof LEVELS)[number]

const LEVEL_LABEL: Record<Level, string> = {
  "not-assessed": "Not assessed",
  developing: "Developing",
  proficient: "Proficient",
  advanced: "Advanced",
  mastered: "Mastered",
}

function levelBadge(level: Level) {
  switch (level) {
    case "mastered":
      return "bg-green-100 text-green-800"
    case "advanced":
      return "bg-emerald-100 text-emerald-800"
    case "proficient":
      return "bg-blue-100 text-blue-800"
    case "developing":
      return "bg-orange-100 text-orange-800"
    default:
      return "bg-gray-100 text-gray-600"
  }
}

interface ReportItem {
  skillId: string
  name: string
  standardCode?: string
  framework?: string
  description?: string
  level: Level
  percent: number
}
interface Report {
  studentId: string
  studentName: string
  gradeLevel: string | null
  categories: { category: string; items: ReportItem[] }[]
  summary: { total: number; assessed: number; mastered: number; developing: number; overallPercent: number | null }
}
interface PickerUser {
  _id: string
  name: string
  studentId?: string
}

export default function SkillsReportPage() {
  const { data: session } = useSession()
  const me = session?.user
  const roles = me?.roles ?? []
  const isStaff = roles.includes("teacher") || roles.includes("admin")
  const isParent = roles.includes("parent")

  const [studentId, setStudentId] = useState("")

  const staffList = useApi<{ users: PickerUser[] }>(isStaff ? "/api/users?role=student&limit=100" : null)
  const parentSelf = useApi<{ children?: PickerUser[] }>(isParent && me?.id ? `/api/users/${me.id}` : null)

  const options = useMemo<PickerUser[]>(
    () => (isStaff ? (staffList.data?.users ?? []) : isParent ? (parentSelf.data?.children ?? []) : []),
    [isStaff, isParent, staffList.data, parentSelf.data],
  )

  useEffect(() => {
    if (studentId) return
    if (!isStaff && !isParent && me?.id) setStudentId(me.id)
    else if (options.length > 0) setStudentId(options[0]._id)
  }, [isStaff, isParent, me?.id, options, studentId])

  const report = useApi<Report>(studentId ? `/api/skills/report/${studentId}` : null)
  const data = report.data

  // Inline assessment (staff only). Tracks which skill is saving.
  const [savingSkill, setSavingSkill] = useState<string | null>(null)

  const assess = async (skillId: string, level: Level) => {
    if (!studentId) return
    setSavingSkill(skillId)
    try {
      await apiMutate("/api/skills/assess", "POST", { student: studentId, skill: skillId, level })
      await report.refetch()
    } finally {
      setSavingSkill(null)
    }
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Skills Report</h1>
          <p className="text-gray-600">
            Skill development against grade-level standards
            {data?.gradeLevel ? ` · Grade ${data.gradeLevel}` : ""}
          </p>
        </div>
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
      </div>

      <AsyncState
        isLoading={report.isLoading}
        error={report.error}
        isEmpty={!data}
        emptyMessage="Select a student to see their skills report."
        onRetry={report.refetch}
      >
        {data && (
          <>
            {data.summary.total === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No standards are defined for {data.gradeLevel ? `grade ${data.gradeLevel}` : "this grade level"} yet.
                  {isStaff && " Add them from Admin → Skills."}
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Overall Skills Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-emerald-600 mb-2">
                        {data.summary.overallPercent !== null ? `${data.summary.overallPercent}%` : "—"}
                      </div>
                      <Progress value={data.summary.overallPercent ?? 0} className="h-2" />
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Skills Mastered</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-blue-600 mb-2">{data.summary.mastered}</div>
                      <p className="text-sm text-gray-600">
                        {data.summary.assessed} of {data.summary.total} assessed
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Developing</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-orange-600 mb-2">{data.summary.developing}</div>
                      <p className="text-sm text-gray-600">Skills to strengthen</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Categories */}
                <div className="space-y-6">
                  {data.categories.map((cat) => (
                    <Card key={cat.category}>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Target className="h-5 w-5 text-emerald-600" />
                          <span>{cat.category}</span>
                        </CardTitle>
                        <CardDescription>{cat.items.length} standards</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-5">
                          {cat.items.map((item) => (
                            <div key={item.skillId}>
                              <div className="flex items-start justify-between gap-3 mb-1">
                                <div>
                                  <span className="font-medium">{item.name}</span>
                                  {item.standardCode && (
                                    <span className="ml-2 text-xs text-muted-foreground">
                                      {item.standardCode}
                                      {item.framework ? ` · ${item.framework}` : ""}
                                    </span>
                                  )}
                                  {item.description && (
                                    <p className="text-sm text-muted-foreground">{item.description}</p>
                                  )}
                                </div>
                                {isStaff ? (
                                  <div className="flex items-center gap-2">
                                    {savingSkill === item.skillId && (
                                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                    )}
                                    <Select
                                      value={item.level}
                                      onValueChange={(v) => assess(item.skillId, v as Level)}
                                    >
                                      <SelectTrigger className="w-36 h-8">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {LEVELS.map((l) => (
                                          <SelectItem key={l} value={l}>
                                            {LEVEL_LABEL[l]}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                ) : (
                                  <Badge className={levelBadge(item.level)}>{LEVEL_LABEL[item.level]}</Badge>
                                )}
                              </div>
                              <Progress value={item.percent} className="h-2" />
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {isStaff && (
                  <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <Award className="h-4 w-4" />
                    As a teacher, change a level above to record this student&apos;s proficiency.
                  </p>
                )}
              </>
            )}
          </>
        )}
      </AsyncState>
    </div>
  )
}
