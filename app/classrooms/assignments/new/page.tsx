"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"

import { useRole } from "@/components/context/role-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useApi } from "@/hooks/use-api"
import { apiMutate } from "@/lib/api/client"

interface TeacherCourse {
  _id: string
  title: string
  code: string
}

export default function NewAssignmentPage() {
  const router = useRouter()
  const { isTeacher, isAdmin, isLoading: rolesLoading } = useRole()
  const canCreate = isTeacher || isAdmin

  // Only courses the teacher owns are offered — the API rejects anything else.
  const { data: courseData } = useApi<{ courses: TeacherCourse[] }>(
    canCreate ? "/api/courses" : null,
  )
  const courses = courseData?.courses ?? []

  const [form, setForm] = useState({
    course: "",
    title: "",
    description: "",
    dueDate: "",
    points: "100",
    category: "homework" as "homework" | "quiz" | "exam" | "project" | "participation",
    status: "draft" as "draft" | "published",
    allowLateSubmission: true,
    latePenaltyPerDay: "10",
  })
  const [error, setError] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!rolesLoading && !canCreate) router.push("/classrooms/assignments")
  }, [rolesLoading, canCreate, router])

  // Default to the teacher's first course once loaded.
  useEffect(() => {
    if (!form.course && courses.length > 0) {
      setForm((f) => ({ ...f, course: courses[0]._id }))
    }
  }, [courses, form.course])

  if (!rolesLoading && !canCreate) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">Only teachers and administrators can create assignments.</p>
          <Button onClick={() => router.push("/classrooms/assignments")}>Back to Assignments</Button>
        </div>
      </div>
    )
  }

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!form.course) return setError("Select a course")
    if (form.title.trim().length < 2) return setError("Title must be at least 2 characters")
    if (!form.dueDate) return setError("Pick a due date")

    const points = Number(form.points)
    if (!Number.isFinite(points) || points < 0) return setError("Points must be zero or more")

    setIsSaving(true)
    try {
      await apiMutate("/api/assignments", "POST", {
        course: form.course,
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        // datetime-local has no timezone; the browser's zone is the intended one.
        dueDate: new Date(form.dueDate).toISOString(),
        points,
        category: form.category,
        status: form.status,
        allowLateSubmission: form.allowLateSubmission,
        latePenaltyPerDay: Number(form.latePenaltyPerDay) || 0,
      })
      router.push("/classrooms/assignments")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the assignment")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold text-emerald-600">New Assignment</h1>
        <p className="text-muted-foreground">Post an assignment to one of your courses.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Assignment details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Course</Label>
              {courses.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  You have no courses yet.{" "}
                  <button
                    type="button"
                    className="text-emerald-600 underline"
                    onClick={() => router.push("/courses")}
                  >
                    Create a course first
                  </button>
                  .
                </p>
              ) : (
                <Select value={form.course} onValueChange={(v) => set("course", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((c) => (
                      <SelectItem key={c._id} value={c._id}>
                        {c.code} — {c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Algebra Problem Set #4"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Instructions</Label>
              <Textarea
                id="description"
                rows={5}
                placeholder="What students need to do…"
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due date</Label>
                <Input
                  id="dueDate"
                  type="datetime-local"
                  value={form.dueDate}
                  onChange={(e) => set("dueDate", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="points">Points</Label>
                <Input
                  id="points"
                  type="number"
                  min={0}
                  value={form.points}
                  onChange={(e) => set("points", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => set("category", v as typeof form.category)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="homework">Homework</SelectItem>
                    <SelectItem value="quiz">Quiz</SelectItem>
                    <SelectItem value="exam">Exam</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                    <SelectItem value="participation">Participation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Submission policy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="allowLate"
                checked={form.allowLateSubmission}
                onCheckedChange={(c) => set("allowLateSubmission", c === true)}
              />
              <Label htmlFor="allowLate" className="font-normal">
                Accept late submissions
              </Label>
            </div>

            {form.allowLateSubmission && (
              <div className="space-y-2 max-w-xs">
                <Label htmlFor="penalty">Late penalty (% of total per day)</Label>
                <Input
                  id="penalty"
                  type="number"
                  min={0}
                  max={100}
                  value={form.latePenaltyPerDay}
                  onChange={(e) => set("latePenaltyPerDay", e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2 max-w-xs">
              <Label>Visibility</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v as typeof form.status)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {/* Students never see drafts; publishing notifies the class. */}
                  <SelectItem value="draft">Draft (hidden from students)</SelectItem>
                  <SelectItem value="published">Publish now (notifies students)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {error && (
          <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <Button type="submit" disabled={isSaving || courses.length === 0}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving…
              </>
            ) : (
              "Create assignment"
            )}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSaving}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
