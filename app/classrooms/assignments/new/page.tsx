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
import { ArrowLeft, Upload, Users } from "lucide-react"

export default function NewAssignmentPage() {
  const router = useRouter()
  const { isTeacher, isAdmin, currentRole } = useRole()
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueDate: "",
    points: "",
    instructions: "",
    attachments: [] as File[],
  })

  useEffect(() => {
    if (!isTeacher && !isAdmin) {
      router.push("/classrooms/assignments")
    }
  }, [isTeacher, isAdmin, router])

  if (!isTeacher && !isAdmin) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">Only teachers and administrators can create new assignments.</p>
          <Button onClick={() => router.push("/classrooms/assignments")}>Back to Assignments</Button>
        </div>
      </div>
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Save assignment to database
    console.log("Creating assignment:", formData)
    router.push("/classrooms/assignments")
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData((prev) => ({
        ...prev,
        attachments: [...prev.attachments, ...Array.from(e.target.files!)],
      }))
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Assignments
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Create New Assignment</h1>
        <p className="text-gray-600 mt-2">Set up a new assignment for your students</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Assignment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Assignment Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Enter assignment title"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the assignment"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="datetime-local"
                  value={formData.dueDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, dueDate: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="points">Points</Label>
                <Input
                  id="points"
                  type="number"
                  value={formData.points}
                  onChange={(e) => setFormData((prev) => ({ ...prev, points: e.target.value }))}
                  placeholder="100"
                  min="0"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="instructions">Instructions</Label>
              <Textarea
                id="instructions"
                value={formData.instructions}
                onChange={(e) => setFormData((prev) => ({ ...prev, instructions: e.target.value }))}
                placeholder="Detailed instructions for students"
                rows={6}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Attachments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Upload assignment materials</p>
              <Input type="file" multiple onChange={handleFileUpload} className="max-w-xs mx-auto" />
            </div>
            {formData.attachments.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Attached Files:</h4>
                <ul className="space-y-1">
                  {formData.attachments.map((file, index) => (
                    <li key={index} className="text-sm text-gray-600">
                      {file.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
            Create Assignment
          </Button>
        </div>
      </form>
    </div>
  )
}
