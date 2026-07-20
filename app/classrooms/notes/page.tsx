"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { FileText, Plus, Search, Calendar, Edit, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"

export default function NotesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

  const notes = [
    {
      id: 1,
      title: "Linear Equations Notes",
      content: "Key points from the linear equations lesson: Remember that the slope-intercept form is y = mx + b...",
      subject: "Mathematics",
      date: "2024-03-13",
      tags: ["algebra", "equations", "math"],
    },
    {
      id: 2,
      title: "Variables and Constants",
      content: "Variables can change, constants stay the same. Important to identify both in equations...",
      subject: "Mathematics",
      date: "2024-03-08",
      tags: ["variables", "constants", "basics"],
    },
    {
      id: 3,
      title: "Shakespeare Analysis",
      content: "Key themes in Hamlet: revenge, madness, mortality. Important quotes to remember...",
      subject: "English",
      date: "2024-03-10",
      tags: ["shakespeare", "hamlet", "literature"],
    },
  ]

  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Notes</h1>
            <p className="text-gray-600 mt-2">Personal study notes and annotations</p>
          </div>
          <Button onClick={() => router.push("/classrooms/notes/new")} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4 mr-2" />
            New Note
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search notes..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredNotes.map((note) => (
          <Card key={note.id} className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2">{note.title}</CardTitle>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(note.date).toLocaleDateString()}</span>
                  </div>
                </div>
                <Badge variant="outline">{note.subject}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">{note.content}</p>
              <div className="flex flex-wrap gap-1 mb-4">
                {note.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => router.push(`/classrooms/notes/${note.id}`)}>
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button size="sm" variant="outline">
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredNotes.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No notes found</h3>
          <p className="text-gray-600 mb-4">
            {searchQuery ? "Try adjusting your search terms" : "Start by creating your first note"}
          </p>
          <Button onClick={() => router.push("/classrooms/notes/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Create Note
          </Button>
        </div>
      )}
    </div>
  )
}
