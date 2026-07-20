"use client"

import type React from "react"
import { useRole } from "@/components/context/role-context"
import { useEffect } from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, MessageSquare } from "lucide-react"

export default function NewDiscussionPage() {
  const router = useRouter()
  const { isTeacher, isAdmin, currentRole } = useRole()
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "",
    tags: "",
  })

  useEffect(() => {
    if (!isTeacher && !isAdmin) {
      router.push("/classrooms/discussions")
    }
  }, [isTeacher, isAdmin, router])

  if (!isTeacher && !isAdmin) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">Only teachers and administrators can create new discussions.</p>
          <Button onClick={() => router.push("/classrooms/discussions")}>Back to Discussions</Button>
        </div>
      </div>
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Save discussion to database
    console.log("Creating discussion:", formData)
    router.push("/classrooms/discussions")
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Discussions
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Start New Discussion</h1>
        <p className="text-gray-600 mt-2">Create a new discussion topic for your class</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Discussion Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Discussion Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Enter discussion title"
                required
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Discussion</SelectItem>
                  <SelectItem value="homework">Homework Help</SelectItem>
                  <SelectItem value="project">Project Discussion</SelectItem>
                  <SelectItem value="announcement">Announcements</SelectItem>
                  <SelectItem value="qa">Q&A</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                placeholder="Write your discussion post here..."
                rows={8}
                required
              />
            </div>

            <div>
              <Label htmlFor="tags">Tags (optional)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData((prev) => ({ ...prev, tags: e.target.value }))}
                placeholder="Enter tags separated by commas"
              />
              <p className="text-sm text-gray-500 mt-1">
                Tags help others find your discussion. Example: math, algebra, homework
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
            Post Discussion
          </Button>
        </div>
      </form>
    </div>
  )
}
