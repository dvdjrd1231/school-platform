"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import {
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  Upload,
  Download,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Save,
  Send,
} from "lucide-react"
import Link from "next/link"

interface AssignmentDetailProps {
  assignmentId: string
}

const assignmentData = {
  id: 1,
  title: "Linear Equations Essay",
  description:
    "Write a 500-word essay explaining real-world applications of linear equations. Include at least 3 examples with detailed explanations.",
  instructions: `
    Requirements:
    • Minimum 500 words
    • Include at least 3 real-world examples
    • Explain the mathematical concepts clearly
    • Use proper citations for any sources
    • Submit as PDF format
    
    Grading Criteria:
    • Content accuracy (40 points)
    • Writing quality (20 points)
    • Examples and explanations (10 points)
    • Formatting and citations (5 points)
  `,
  subject: "Mathematics",
  dueDate: "2024-12-22",
  dueTime: "11:59 PM",
  points: 75,
  status: "in-progress",
  submittedAt: null,
  grade: null,
  feedback: null,
  attachments: ["essay_guidelines.pdf", "example_applications.pdf"],
  submissionFiles: ["draft_essay.docx"],
}

export function AssignmentDetail({ assignmentId }: AssignmentDetailProps) {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [submissionNotes, setSubmissionNotes] = useState("")
  const [isDragOver, setIsDragOver] = useState(false)

  const handleFileUpload = (files: FileList | null) => {
    if (files) {
      const newFiles = Array.from(files)
      setUploadedFiles((prev) => [...prev, ...newFiles])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    handleFileUpload(e.dataTransfer.files)
  }

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate)
    const now = new Date()
    const diffTime = due.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const daysUntilDue = getDaysUntilDue(assignmentData.dueDate)
  const isUrgent = daysUntilDue <= 2

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/assignments">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Assignments
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-balance">{assignmentData.title}</h1>
            <p className="text-muted-foreground">{assignmentData.subject}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={assignmentData.status === "submitted" ? "default" : "secondary"}>
            {assignmentData.status === "submitted" ? "Submitted" : "In Progress"}
          </Badge>
          {isUrgent && (
            <Badge variant="destructive" className="text-xs">
              Due Soon
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Assignment Details */}
          <Card>
            <CardHeader>
              <CardTitle>Assignment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Due Date</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(assignmentData.dueDate).toLocaleDateString()} at {assignmentData.dueTime}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Points</p>
                    <p className="text-sm text-muted-foreground">{assignmentData.points} points</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Time Left</p>
                    <p className={`text-sm ${isUrgent ? "text-red-600" : "text-muted-foreground"}`}>
                      {daysUntilDue > 0
                        ? `${daysUntilDue} days`
                        : daysUntilDue === 0
                          ? "Due today"
                          : `${Math.abs(daysUntilDue)} days overdue`}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-muted-foreground text-pretty">{assignmentData.description}</p>
              </div>

              <div>
                <h4 className="font-medium mb-2">Instructions</h4>
                <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans">
                  {assignmentData.instructions}
                </pre>
              </div>

              {assignmentData.attachments.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Assignment Files</h4>
                  <div className="flex flex-wrap gap-2">
                    {assignmentData.attachments.map((file, index) => (
                      <Button key={index} variant="outline" size="sm">
                        <Download className="h-3 w-3 mr-1" />
                        {file}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Submit Your Work</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">Upload your assignment files</h3>
                <p className="text-sm text-muted-foreground mb-4">Drag and drop files here, or click to browse</p>
                <input
                  type="file"
                  multiple
                  className="hidden"
                  id="file-upload"
                  onChange={(e) => handleFileUpload(e.target.files)}
                />
                <label htmlFor="file-upload">
                  <Button variant="outline" className="cursor-pointer bg-transparent">
                    Choose Files
                  </Button>
                </label>
              </div>

              {uploadedFiles.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Uploaded Files</h4>
                  <div className="space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium text-sm">{file.name}</p>
                            <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => removeFile(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-medium mb-2">Submission Notes (Optional)</h4>
                <Textarea
                  placeholder="Add any notes or comments about your submission..."
                  value={submissionNotes}
                  onChange={(e) => setSubmissionNotes(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline">
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
                </Button>
                <Button>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Assignment
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Completion</span>
                    <span className="text-sm text-muted-foreground">60%</span>
                  </div>
                  <Progress value={60} className="h-2" />
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Read assignment instructions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Download reference materials</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span>Upload assignment files</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>Submit final work</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Previous Submissions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Previous Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {assignmentData.submissionFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <div>
                        <p className="font-medium text-sm">{file}</p>
                        <p className="text-xs text-muted-foreground">Uploaded 2 days ago</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {assignmentData.submissionFiles.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No previous submissions</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Help */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <FileText className="h-4 w-4 mr-2" />
                Assignment Guidelines
              </Button>
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Report an Issue
              </Button>
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <Clock className="h-4 w-4 mr-2" />
                Request Extension
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
