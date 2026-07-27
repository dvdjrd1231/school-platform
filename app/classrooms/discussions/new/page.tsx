"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, MessageSquare } from "lucide-react"

import { apiMutate } from "@/lib/api/client"
import { useCourses } from "@/components/context/course-context"
import { useRole } from "@/components/context/role-context"
import { BackButton } from "@/components/ui/back-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

const CATEGORIES = [
  "General",
  "Homework Help",
  "Project Discussion",
  "Course Content",
  "Q&A",
] as const

/**
 * Full-page composer for a new discussion.
 *
 * Anyone in a class may start a thread — the board is how students ask each
 * other questions. Only teachers and admins can pin one to the top.
 */
export default function NewDiscussionPage() {
  const router = useRouter()
  const { isTeacher, isAdmin } = useRole()
  const { courses, selectedId } = useCourses()
  const canPin = isTeacher || isAdmin

  const [form, setForm] = useState({
    title: "",
    content: "",
    category: "General",
    course: selectedId ?? "",
    pinned: false,
  })
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (form.title.trim().length < 3) return setError("Give the discussion a title")
    if (!form.content.trim()) return setError("Write the first post")

    setSaving(true)
    try {
      const created = await apiMutate<{ _id: string }>("/api/discussions", "POST", {
        title: form.title.trim(),
        content: form.content.trim(),
        category: form.category,
        course: form.course || undefined,
        pinned: canPin ? form.pinned : false,
      })
      router.push(`/discussions/${created._id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the discussion")
      setSaving(false)
    }
  }

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <BackButton fallback="/classrooms/discussions" label="Back to Discussions" className="mb-4" />
        <h1 className="text-3xl font-bold text-gray-900">Start a new discussion</h1>
        <p className="mt-2 text-gray-600">Create a discussion topic for your class</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Discussion details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Discussion title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Enter a discussion title"
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(value) => setForm((f) => ({ ...f, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Class</Label>
                <Select
                  value={form.course || "school"}
                  onValueChange={(value) =>
                    setForm((f) => ({ ...f, course: value === "school" ? "" : value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="school">Whole school</SelectItem>
                    {courses.map((c) => (
                      <SelectItem key={c._id} value={c._id}>
                        {c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                placeholder="Write your discussion post here…"
                rows={8}
                required
              />
            </div>

            {canPin && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.pinned}
                  onChange={(e) => setForm((f) => ({ ...f, pinned: e.target.checked }))}
                />
                Pin this discussion to the top of the board
              </label>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Post discussion
          </Button>
        </div>
      </form>
    </div>
  )
}
