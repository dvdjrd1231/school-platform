"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Save, Calendar, Tag } from "lucide-react"
import { useRouter } from "next/navigation"

export default function EditNotePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [note, setNote] = useState({
    title: "Linear Equations Notes",
    content: `Key points from the linear equations lesson:

1. Slope-intercept form: y = mx + b
   - m = slope (rise over run)
   - b = y-intercept (where line crosses y-axis)

2. Standard form: Ax + By = C
   - Useful for finding intercepts quickly
   - A, B, and C are integers

3. Point-slope form: y - y₁ = m(x - x₁)
   - Useful when you know a point and the slope
   - (x₁, y₁) is the known point

Important examples:
- y = 2x + 3 (slope = 2, y-intercept = 3)
- 3x + 4y = 12 (can be converted to slope-intercept)

Remember: Parallel lines have the same slope, perpendicular lines have negative reciprocal slopes.`,
    subject: "Mathematics",
    tags: "algebra, equations, math, slope",
    date: "2024-03-13",
  })

  const handleSave = () => {
    // TODO: Save note to database
    console.log("Saving note:", note)
    router.push("/classrooms/notes")
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Notes
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Edit Note</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Note Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <Input
              value={note.title}
              onChange={(e) => setNote((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Enter note title"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
              <Input
                value={note.subject}
                onChange={(e) => setNote((prev) => ({ ...prev, subject: e.target.value }))}
                placeholder="Subject"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
              <Input
                value={note.tags}
                onChange={(e) => setNote((prev) => ({ ...prev, tags: e.target.value }))}
                placeholder="Separate tags with commas"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
            <Textarea
              value={note.content}
              onChange={(e) => setNote((prev) => ({ ...prev, content: e.target.value }))}
              placeholder="Write your notes here..."
              rows={15}
              className="font-mono"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="h-4 w-4" />
              <span>Last modified: {new Date(note.date).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">
                <Save className="h-4 w-4 mr-2" />
                Save Note
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
