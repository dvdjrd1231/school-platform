"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  Plus,
  BookOpen,
  Video,
  FileText,
  Calendar,
  Clock,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Upload,
  Play,
  Download,
  Users,
  CheckCircle,
} from "lucide-react"

export default function LessonManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterClass, setFilterClass] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  // Mock data for lessons
  const lessons = [
    {
      id: 1,
      title: "Introduction to Algebra",
      class: "Mathematics 101",
      module: "Module 1: Fundamentals",
      type: "Video + Reading",
      duration: "45 min",
      status: "Published",
      completionRate: 85,
      dueDate: "2024-01-15",
      materials: ["video.mp4", "worksheet.pdf", "slides.pptx"],
      description: "Basic algebraic concepts and operations",
    },
    {
      id: 2,
      title: "Shakespeare's Hamlet",
      class: "English Literature",
      module: "Module 3: Classic Literature",
      type: "Reading + Discussion",
      duration: "60 min",
      status: "Published",
      completionRate: 92,
      dueDate: "2024-01-18",
      materials: ["hamlet_text.pdf", "analysis_guide.pdf"],
      description: "Character analysis and themes in Hamlet",
    },
    {
      id: 3,
      title: "Cell Structure and Function",
      class: "Biology Fundamentals",
      module: "Module 2: Cell Biology",
      type: "Interactive + Lab",
      duration: "90 min",
      status: "Draft",
      completionRate: 0,
      dueDate: "2024-01-20",
      materials: ["lab_instructions.pdf", "microscope_images.zip"],
      description: "Exploring cellular components through microscopy",
    },
    {
      id: 4,
      title: "World War II Timeline",
      class: "World History",
      module: "Module 4: 20th Century",
      type: "Interactive Timeline",
      duration: "50 min",
      status: "Published",
      completionRate: 78,
      dueDate: "2024-01-22",
      materials: ["timeline.html", "primary_sources.pdf"],
      description: "Key events and turning points of WWII",
    },
    {
      id: 5,
      title: "Chemical Bonding",
      class: "Chemistry Advanced",
      module: "Module 1: Atomic Structure",
      type: "Video + Quiz",
      duration: "40 min",
      status: "Scheduled",
      completionRate: 0,
      dueDate: "2024-01-25",
      materials: ["bonding_video.mp4", "practice_quiz.json"],
      description: "Ionic, covalent, and metallic bonding principles",
    },
  ]

  const filteredLessons = lessons.filter((lesson) => {
    const matchesSearch =
      lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lesson.class.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesClass = filterClass === "all" || lesson.class === filterClass
    const matchesStatus = filterStatus === "all" || lesson.status === filterStatus
    return matchesSearch && matchesClass && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Published":
        return <Badge className="bg-emerald-100 text-emerald-800">Published</Badge>
      case "Draft":
        return <Badge variant="secondary">Draft</Badge>
      case "Scheduled":
        return <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTypeIcon = (type: string) => {
    if (type.includes("Video")) return <Video className="h-4 w-4" />
    if (type.includes("Reading")) return <FileText className="h-4 w-4" />
    if (type.includes("Interactive")) return <Play className="h-4 w-4" />
    return <BookOpen className="h-4 w-4" />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lesson Management</h1>
          <p className="text-gray-600 mt-1">Create and manage lesson content and materials</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Lesson
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Lesson</DialogTitle>
              <DialogDescription>
                Add a new lesson with content, materials, and scheduling information.
              </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="schedule">Schedule</TabsTrigger>
              </TabsList>
              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="lessonTitle">Lesson Title</Label>
                    <Input id="lessonTitle" placeholder="e.g., Introduction to Algebra" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lessonClass">Class</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="math101">Mathematics 101</SelectItem>
                        <SelectItem value="english">English Literature</SelectItem>
                        <SelectItem value="biology">Biology Fundamentals</SelectItem>
                        <SelectItem value="history">World History</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="module">Module/Unit</Label>
                    <Input id="module" placeholder="e.g., Module 1: Fundamentals" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration</Label>
                    <Input id="duration" placeholder="e.g., 45 min" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lessonType">Lesson Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select lesson type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">Video Lesson</SelectItem>
                      <SelectItem value="reading">Reading Assignment</SelectItem>
                      <SelectItem value="interactive">Interactive Content</SelectItem>
                      <SelectItem value="lab">Lab/Practical</SelectItem>
                      <SelectItem value="discussion">Discussion</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" placeholder="Lesson objectives and overview..." />
                </div>
              </TabsContent>
              <TabsContent value="content" className="space-y-4">
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4">
                      <Button variant="outline">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Materials
                      </Button>
                      <p className="text-sm text-gray-500 mt-2">
                        Upload videos, documents, presentations, or other materials
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="videoUrl">Video URL (Optional)</Label>
                    <Input id="videoUrl" placeholder="https://..." />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="readingMaterial">Reading Material</Label>
                    <Textarea id="readingMaterial" placeholder="Paste reading content or provide instructions..." />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instructions">Student Instructions</Label>
                    <Textarea id="instructions" placeholder="What should students do in this lesson?" />
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="schedule" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="publishDate">Publish Date</Label>
                    <Input id="publishDate" type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input id="dueDate" type="date" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Prerequisites</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="prereq1" />
                      <label htmlFor="prereq1" className="text-sm">
                        Previous lesson completion required
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="prereq2" />
                      <label htmlFor="prereq2" className="text-sm">
                        Quiz completion required
                      </label>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setIsCreateDialogOpen(false)}>
                Create Lesson
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Lessons</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">+12 this week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">142</div>
            <p className="text-xs text-muted-foreground">91% of total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Completion</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">84%</div>
            <p className="text-xs text-muted-foreground">+3% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Video Lessons</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89</div>
            <p className="text-xs text-muted-foreground">57% of all lessons</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Lesson Library</CardTitle>
          <CardDescription>Manage all lesson content and materials</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search lessons or classes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterClass} onValueChange={setFilterClass}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                <SelectItem value="Mathematics 101">Mathematics 101</SelectItem>
                <SelectItem value="English Literature">English Literature</SelectItem>
                <SelectItem value="Biology Fundamentals">Biology Fundamentals</SelectItem>
                <SelectItem value="World History">World History</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Published">Published</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Scheduled">Scheduled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Lessons Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lesson Title</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Completion</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLessons.map((lesson) => (
                  <TableRow key={lesson.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(lesson.type)}
                        {lesson.title}
                      </div>
                    </TableCell>
                    <TableCell>{lesson.class}</TableCell>
                    <TableCell className="text-sm text-gray-600">{lesson.module}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {lesson.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-3 w-3" />
                        {lesson.duration}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{lesson.completionRate}%</span>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-emerald-600 h-2 rounded-full"
                            style={{ width: `${lesson.completionRate}%` }}
                          ></div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3" />
                        {lesson.dueDate}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(lesson.status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            Preview Lesson
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Lesson
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="mr-2 h-4 w-4" />
                            Download Materials
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Users className="mr-2 h-4 w-4" />
                            View Analytics
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Lesson
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
