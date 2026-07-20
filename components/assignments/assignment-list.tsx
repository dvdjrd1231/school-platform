"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  FileText,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Upload,
  Download,
  Eye,
  Plus,
  Filter,
  Search,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { getAssignments } from "@/lib/database"
import { useRouter } from "next/navigation"
import { useRole } from "@/components/context/role-context"

const getStatusColor = (status: string) => {
  switch (status) {
    case "submitted":
      return "text-green-600"
    case "in-progress":
      return "text-blue-600"
    case "overdue":
      return "text-red-600"
    default:
      return "text-muted-foreground"
  }
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "submitted":
      return <Badge className="bg-green-100 text-green-800">Submitted</Badge>
    case "in-progress":
      return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>
    case "overdue":
      return <Badge className="bg-red-100 text-red-800">Overdue</Badge>
    default:
      return <Badge variant="secondary">Not Started</Badge>
  }
}

const getDaysUntilDue = (dueDate: string) => {
  const due = new Date(dueDate)
  const now = new Date()
  const diffTime = due.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

export function AssignmentList() {
  const [selectedTab, setSelectedTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()
  const { isTeacher, isAdmin } = useRole()

  const assignments = getAssignments()

  const filteredAssignments = assignments.filter((assignment) => {
    const matchesSearch = assignment.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTab =
      selectedTab === "all" ||
      (selectedTab === "pending" && ["not-started", "in-progress"].includes(assignment.status)) ||
      (selectedTab === "submitted" && assignment.status === "submitted") ||
      (selectedTab === "overdue" && assignment.status === "overdue")
    return matchesSearch && matchesTab
  })

  const stats = {
    total: assignments.length,
    submitted: assignments.filter((a) => a.status === "submitted").length,
    pending: assignments.filter((a) => ["not-started", "in-progress"].includes(a.status)).length,
    overdue: assignments.filter((a) => a.status === "overdue").length,
  }

  const handleDownload = (filename: string) => {
    const link = document.createElement("a")
    link.href = `/sample-assignment.pdf`
    link.download = filename
    link.click()
  }

  const handleViewFile = (filename: string) => {
    window.open(`/sample-assignment.pdf`, "_blank")
  }

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-balance">Assignments</h1>
          <p className="text-muted-foreground">Mathematics - Grade 10</p>
        </div>
        {(isTeacher || isAdmin) && (
          <Button onClick={() => router.push("/classrooms/assignments/new")}>
            <Plus className="h-4 w-4 mr-2" />
            New Assignment
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search assignments..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => router.push("/classrooms/assignments/filter")}>
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">{stats.total} Total</p>
                <p className="text-xs text-muted-foreground">All assignments</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">{stats.submitted} Submitted</p>
                <p className="text-xs text-muted-foreground">Completed work</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">{stats.pending} Pending</p>
                <p className="text-xs text-muted-foreground">In progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm font-medium">{stats.overdue} Overdue</p>
                <p className="text-xs text-muted-foreground">Past due date</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
          <TabsTrigger value="submitted">Submitted ({stats.submitted})</TabsTrigger>
          <TabsTrigger value="overdue">Overdue ({stats.overdue})</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="space-y-4 mt-6">
          {filteredAssignments.map((assignment) => {
            const daysUntilDue = getDaysUntilDue(assignment.dueDate)
            const isUrgent = daysUntilDue <= 2 && assignment.status !== "submitted"

            return (
              <Card key={assignment.id} className={`${isUrgent ? "border-red-200 bg-red-50/50" : ""}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Link href={`/classrooms/assignments/${assignment.id}`}>
                          <h3 className="text-lg font-semibold hover:text-primary cursor-pointer text-balance">
                            {assignment.title}
                          </h3>
                        </Link>
                        {getStatusBadge(assignment.status)}
                        {isUrgent && (
                          <Badge variant="destructive" className="text-xs">
                            Urgent
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground mb-3 text-pretty">{assignment.description}</p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-sm font-medium">{assignment.points} points</p>
                      {assignment.grade && (
                        <p className="text-sm text-green-600">
                          {assignment.grade}/{assignment.points}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                      <span className="text-muted-foreground">at {assignment.dueTime}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className={getStatusColor(assignment.status)}>
                        {daysUntilDue > 0
                          ? `${daysUntilDue} days left`
                          : daysUntilDue === 0
                            ? "Due today"
                            : `${Math.abs(daysUntilDue)} days overdue`}
                      </span>
                    </div>
                    {assignment.submittedAt && (
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Submitted: {assignment.submittedAt}</span>
                      </div>
                    )}
                  </div>

                  {assignment.attachments.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium mb-2">Assignment Files:</p>
                      <div className="flex flex-wrap gap-2">
                        {assignment.attachments.map((file, index) => (
                          <Button key={index} variant="outline" size="sm" onClick={() => handleDownload(file)}>
                            <Download className="h-3 w-3 mr-1" />
                            {file}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {assignment.submissionFiles.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium mb-2">Your Submissions:</p>
                      <div className="flex flex-wrap gap-2">
                        {assignment.submissionFiles.map((file, index) => (
                          <Button key={index} variant="outline" size="sm" onClick={() => handleViewFile(file)}>
                            <Eye className="h-3 w-3 mr-1" />
                            {file}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {assignment.feedback && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm font-medium text-blue-800 mb-1">Teacher Feedback:</p>
                      <p className="text-sm text-blue-700">{assignment.feedback}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {assignment.status === "submitted" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/classrooms/assignments/${assignment.id}/submission`)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Submission
                        </Button>
                      ) : (
                        <Link href={`/classrooms/assignments/${assignment.id}`}>
                          <Button size="sm">
                            <Upload className="h-4 w-4 mr-2" />
                            {assignment.status === "not-started" ? "Start Assignment" : "Continue Work"}
                          </Button>
                        </Link>
                      )}
                    </div>
                    <div className="text-right">
                      {assignment.status !== "submitted" && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Progress:</span>
                          <Progress value={assignment.status === "in-progress" ? 50 : 0} className="w-20 h-2" />
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </TabsContent>
      </Tabs>
    </div>
  )
}
