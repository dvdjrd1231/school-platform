"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Save, Plus } from "lucide-react"
import { useRouter } from "next/navigation"

export default function NewNotePage() {
  const router = useRouter()
  const [note, setNote] = useState({
    title: "",
    content: "",
    subject: "",
    tags: "",
  })

  const handleSave = () => {
    // TODO: Save note to database
    console.log("Creating note:", note)
    router.push("/classrooms/notes")
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Notes
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Create New Note</h1>
        <p className="text-gray-600 mt-2">Add a new study note or annotation</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
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
                placeholder="Mathematics, English, Science, etc."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
              <Input
                value={note.tags}
                onChange={(e) => setNote((prev) => ({ ...prev, tags: e.target.value }))}
                placeholder="algebra, equations, homework (separate with commas)"
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

          <div className="flex items-center justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">
              <Save className="h-4 w-4 mr-2" />
              Create Note
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
