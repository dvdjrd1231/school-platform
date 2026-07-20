"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, Video, FileText, CheckCircle, Lock, PlayCircle, Download, Clock, Users, Star } from "lucide-react"
import { useRouter } from "next/navigation"

const courseModules = [
  {
    id: 1,
    title: "Introduction to Algebra",
    description: "Basic concepts and fundamentals",
    duration: "2 hours",
    progress: 100,
    status: "completed",
    lessons: [
      {
        id: 1,
        title: "What is Algebra?",
        type: "video",
        duration: "15 min",
        completed: true,
      },
      {
        id: 2,
        title: "Variables and Constants",
        type: "reading",
        duration: "10 min",
        completed: true,
      },
      {
        id: 3,
        title: "Basic Operations",
        type: "video",
        duration: "20 min",
        completed: true,
      },
    ],
  },
  {
    id: 2,
    title: "Linear Equations",
    description: "Solving and graphing linear equations",
    duration: "3 hours",
    progress: 75,
    status: "current",
    lessons: [
      {
        id: 4,
        title: "Introduction to Linear Equations",
        type: "video",
        duration: "25 min",
        completed: true,
      },
      {
        id: 5,
        title: "Solving Linear Equations",
        type: "reading",
        duration: "15 min",
        completed: true,
      },
      {
        id: 6,
        title: "Graphing Linear Equations",
        type: "video",
        duration: "30 min",
        completed: false,
        current: true,
      },
      {
        id: 7,
        title: "Practice Problems",
        type: "assignment",
        duration: "45 min",
        completed: false,
      },
    ],
  },
  {
    id: 3,
    title: "Quadratic Equations",
    description: "Advanced algebraic concepts",
    duration: "4 hours",
    progress: 0,
    status: "locked",
    lessons: [
      {
        id: 8,
        title: "Introduction to Quadratics",
        type: "video",
        duration: "20 min",
        completed: false,
      },
      {
        id: 9,
        title: "Factoring Quadratics",
        type: "reading",
        duration: "25 min",
        completed: false,
      },
    ],
  },
]

export function CourseContent() {
  const [selectedModule, setSelectedModule] = useState(courseModules[1])
  const [selectedLesson, setSelectedLesson] = useState(selectedModule.lessons[2])
  const router = useRouter()

  const handleDownload = (filename: string) => {
    const link = document.createElement("a")
    link.href = `/sample-assignment.pdf`
    link.download = filename
    link.click()
  }

  return (
    <div className="flex-1 p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-balance">Mathematics - Grade 10</h1>
            <p className="text-muted-foreground">Course Content & Materials</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Overall Progress</p>
              <div className="flex items-center gap-2">
                <Progress value={58} className="w-24" />
                <span className="text-sm font-medium">58%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Course Modules Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Course Modules</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {courseModules.map((module) => (
                <div
                  key={module.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedModule.id === module.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                  } ${module.status === "locked" ? "opacity-50" : ""}`}
                  onClick={() => {
                    if (module.status !== "locked") {
                      setSelectedModule(module)
                      setSelectedLesson(module.lessons[0])
                    }
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-sm">{module.title}</h3>
                    {module.status === "completed" && <CheckCircle className="h-4 w-4 text-green-500" />}
                    {module.status === "current" && (
                      <Badge variant="default" className="text-xs">
                        Current
                      </Badge>
                    )}
                    {module.status === "locked" && <Lock className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{module.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {module.duration}
                    </span>
                    {module.status !== "locked" && (
                      <div className="flex items-center gap-1">
                        <Progress value={module.progress} className="w-12 h-1" />
                        <span className="text-xs">{module.progress}%</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="content" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="materials">Materials</TabsTrigger>
              <TabsTrigger value="notes">My Notes</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-6">
              {/* Current Lesson Display */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {selectedLesson.type === "video" && <Video className="h-5 w-5" />}
                        {selectedLesson.type === "reading" && <BookOpen className="h-5 w-5" />}
                        {selectedLesson.type === "assignment" && <FileText className="h-5 w-5" />}
                        {selectedLesson.title}
                      </CardTitle>
                      <p className="text-muted-foreground">
                        {selectedModule.title} • {selectedLesson.duration}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedLesson.completed && (
                        <Badge variant="outline" className="text-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                      )}
                      {selectedLesson.current && <Badge variant="default">Current Lesson</Badge>}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {selectedLesson.type === "video" && (
                    <div className="space-y-4">
                      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          <PlayCircle className="h-16 w-16 text-primary mx-auto mb-4" />
                          <h3 className="font-medium mb-2">{selectedLesson.title}</h3>
                          <p className="text-sm text-muted-foreground mb-4">Video lesson • {selectedLesson.duration}</p>
                          <Button>
                            <PlayCircle className="h-4 w-4 mr-2" />
                            Play Video
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Button variant="outline" size="sm" onClick={() => handleDownload(selectedLesson.title)}>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span>24 students watched</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm">4.8 (12 reviews)</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedLesson.type === "reading" && (
                    <div className="space-y-4">
                      <div className="prose max-w-none">
                        <h3>Variables and Constants</h3>
                        <p>
                          In algebra, we work with two main types of mathematical objects: variables and constants.
                          Understanding the difference between these is fundamental to mastering algebraic concepts.
                        </p>
                        <h4>What are Variables?</h4>
                        <p>
                          A variable is a symbol (usually a letter) that represents an unknown value or a value that can
                          change. Common variables include x, y, z, a, b, and c.
                        </p>
                        <h4>What are Constants?</h4>
                        <p>
                          A constant is a fixed value that does not change. Numbers like 5, -3, 0.7, and π are all
                          constants.
                        </p>
                        <h4>Examples</h4>
                        <ul>
                          <li>In the expression 3x + 7, the variable is x and the constants are 3 and 7</li>
                          <li>In the equation y = 2x + 5, the variables are x and y, while 2 and 5 are constants</li>
                        </ul>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-muted-foreground">Reading completed</span>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handleDownload(selectedLesson.title)}>
                          <Download className="h-4 w-4 mr-2" />
                          Download PDF
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Lesson Navigation */}
              <Card>
                <CardHeader>
                  <CardTitle>Lessons in {selectedModule.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {selectedModule.lessons.map((lesson, index) => (
                      <div
                        key={lesson.id}
                        className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedLesson.id === lesson.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                        }`}
                        onClick={() => setSelectedLesson(lesson)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                            {lesson.type === "video" && <Video className="h-4 w-4" />}
                            {lesson.type === "reading" && <BookOpen className="h-4 w-4" />}
                            {lesson.type === "assignment" && <FileText className="h-4 w-4" />}
                          </div>
                          <div>
                            <h4 className="font-medium text-sm">{lesson.title}</h4>
                            <p className="text-xs text-muted-foreground">
                              {lesson.type.charAt(0).toUpperCase() + lesson.type.slice(1)} • {lesson.duration}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {lesson.completed && <CheckCircle className="h-4 w-4 text-green-500" />}
                          {lesson.current && (
                            <Badge variant="default" className="text-xs">
                              Current
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="materials" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Course Materials</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      {
                        title: "Algebra Textbook - Chapter 1-5",
                        type: "PDF",
                        size: "2.4 MB",
                        downloads: 156,
                      },
                      {
                        title: "Practice Problem Sets",
                        type: "PDF",
                        size: "1.8 MB",
                        downloads: 89,
                      },
                      {
                        title: "Formula Reference Sheet",
                        type: "PDF",
                        size: "0.5 MB",
                        downloads: 234,
                      },
                      {
                        title: "Video Lecture Slides",
                        type: "PPTX",
                        size: "5.2 MB",
                        downloads: 67,
                      },
                    ].map((material, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-8 w-8 text-primary" />
                          <div>
                            <h4 className="font-medium text-sm">{material.title}</h4>
                            <p className="text-xs text-muted-foreground">
                              {material.type} • {material.size} • {material.downloads} downloads
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handleDownload(material.title)}>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notes" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>My Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div
                      className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => router.push("/classrooms/notes/1")}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm">Linear Equations Notes</h4>
                        <span className="text-xs text-muted-foreground">2 days ago</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Key points from the linear equations lesson: Remember that the slope-intercept form is y = mx +
                        b...
                      </p>
                    </div>
                    <div
                      className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => router.push("/classrooms/notes/2")}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm">Variables and Constants</h4>
                        <span className="text-xs text-muted-foreground">1 week ago</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Variables can change, constants stay the same. Important to identify both in equations...
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full bg-transparent"
                      onClick={() => router.push("/classrooms/notes/new")}
                    >
                      Add New Note
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
