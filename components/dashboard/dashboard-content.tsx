"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  BookOpen,
  Calendar,
  FileText,
  Megaphone,
  TrendingUp,
  User,
  Video,
  CheckCircle,
  AlertCircle,
  PlayCircle,
} from "lucide-react"
import { useRouter } from "next/navigation"

export function DashboardContent() {
  const router = useRouter()

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-6 border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-balance">Welcome back, John!</h1>
            <p className="text-muted-foreground mt-1">Ready to continue your learning journey?</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Current Course</p>
            <p className="font-semibold text-primary">Mathematics - Grade 10</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* My Courses */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                My Courses (3)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  name: "Mathematics - Grade 10",
                  progress: 75,
                  nextLesson: "Chapter 3: Algebra",
                  dueDate: "Due Tomorrow",
                  status: "active",
                },
                {
                  name: "English Literature - Grade 10",
                  progress: 60,
                  nextLesson: "Shakespeare Analysis",
                  dueDate: "Due in 3 days",
                  status: "active",
                },
                {
                  name: "Science - Grade 10",
                  progress: 45,
                  nextLesson: "Chemistry Basics",
                  dueDate: "Due in 1 week",
                  status: "pending",
                },
              ].map((course, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => router.push("/classrooms")}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium">{course.name}</h3>
                      <Badge variant={course.status === "active" ? "default" : "secondary"}>
                        {course.status === "active" ? "Active" : "Pending"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">Next: {course.nextLesson}</p>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <Progress value={course.progress} className="h-2" />
                      </div>
                      <span className="text-sm text-muted-foreground">{course.progress}%</span>
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    <p className="text-sm text-muted-foreground mb-2">{course.dueDate}</p>
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push("/classrooms/content")
                      }}
                    >
                      Continue
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Updates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Updates (2)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                {
                  title: "New assignment posted in Mathematics",
                  description: "Algebra Problem Set - Due Friday",
                  time: "2 hours ago",
                  type: "assignment",
                  route: "/classrooms/assignments",
                },
                {
                  title: "Grade updated for English Essay",
                  description: "Your essay received an A- grade",
                  time: "1 day ago",
                  type: "grade",
                  route: "/classrooms/grades",
                },
              ].map((update, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => router.push(update.route)}
                >
                  <div className="mt-1">
                    {update.type === "assignment" ? (
                      <FileText className="h-4 w-4 text-primary" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{update.title}</h4>
                    <p className="text-sm text-muted-foreground">{update.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">{update.time}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Current Course Content */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlayCircle className="h-5 w-5" />
                Mathematics - Grade 10
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/70 transition-colors"
                  onClick={() => router.push("/classrooms/content")}
                >
                  <div className="flex items-center gap-3">
                    <Video className="h-5 w-5 text-primary" />
                    <div>
                      <h4 className="font-medium">Chapter 2: Linear Equations</h4>
                      <p className="text-sm text-muted-foreground">Video lesson • 25 minutes</p>
                    </div>
                  </div>
                  <Badge variant="outline">Completed</Badge>
                </div>
                <div
                  className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg cursor-pointer hover:bg-primary/10 transition-colors"
                  onClick={() => router.push("/classrooms/content")}
                >
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <div>
                      <h4 className="font-medium">Chapter 3: Algebra Fundamentals</h4>
                      <p className="text-sm text-muted-foreground">Reading + Practice • 45 minutes</p>
                    </div>
                  </div>
                  <Badge>Current</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg opacity-60">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5" />
                    <div>
                      <h4 className="font-medium">Chapter 4: Advanced Algebra</h4>
                      <p className="text-sm text-muted-foreground">Assignment • Due next week</p>
                    </div>
                  </div>
                  <Badge variant="secondary">Locked</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Announcements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="h-5 w-5" />
                Announcements (5)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                {
                  title: "School Holiday Notice",
                  content: "School will be closed next Monday for Teacher Development Day.",
                  date: "Today",
                  priority: "high",
                },
                {
                  title: "Library Hours Extended",
                  content: "Library now open until 8 PM on weekdays.",
                  date: "Yesterday",
                  priority: "normal",
                },
                {
                  title: "Parent-Teacher Conference",
                  content: "Conferences scheduled for next month. Sign up required.",
                  date: "2 days ago",
                  priority: "normal",
                },
              ].map((announcement, index) => (
                <div
                  key={index}
                  className="p-3 border rounded-lg space-y-2 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => router.push("/announcements")}
                >
                  <div className="flex items-start justify-between">
                    <h4 className="font-medium text-sm">{announcement.title}</h4>
                    {announcement.priority === "high" && <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5" />}
                  </div>
                  <p className="text-sm text-muted-foreground">{announcement.content}</p>
                  <p className="text-xs text-muted-foreground">{announcement.date}</p>
                </div>
              ))}
              <Button
                variant="outline"
                className="w-full bg-transparent"
                size="sm"
                onClick={() => router.push("/announcements")}
              >
                View All Announcements
              </Button>
            </CardContent>
          </Card>

          {/* Calendar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Calendar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-center p-4 border rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">15</p>
                <p className="text-sm text-muted-foreground">December 2024</p>
              </div>
              <div className="space-y-2">
                {[
                  { event: "Math Quiz", time: "10:00 AM", date: "Today", route: "/classrooms/quizzes" },
                  { event: "English Essay Due", time: "11:59 PM", date: "Tomorrow", route: "/classrooms/assignments" },
                  { event: "Science Lab", time: "2:00 PM", date: "Wednesday", route: "/classrooms/content" },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 border rounded hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => router.push(item.route)}
                  >
                    <div>
                      <p className="font-medium text-sm">{item.event}</p>
                      <p className="text-xs text-muted-foreground">{item.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                className="w-full bg-transparent"
                size="sm"
                onClick={() => router.push("/classrooms/calendar")}
              >
                View Full Calendar
              </Button>
            </CardContent>
          </Card>

          {/* Instructor Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Instructor Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium">Dr. Sarah Johnson</h4>
                  <p className="text-sm text-muted-foreground">Mathematics Teacher</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Office Hours:</span>
                  <span>Mon-Fri 2-4 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Room:</span>
                  <span>Math Lab 205</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="text-primary">s.johnson@maatk12.edu</span>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full mt-4 bg-transparent"
                size="sm"
                onClick={() => (window.location.href = "mailto:s.johnson@maatk12.edu")}
              >
                Contact Instructor
              </Button>
            </CardContent>
          </Card>

          {/* My Surveys */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                My Surveys
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div
                  className="p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => router.push("/classrooms/tools/surveys")}
                >
                  <h4 className="font-medium text-sm">Course Feedback Survey</h4>
                  <p className="text-xs text-muted-foreground">Mathematics - Grade 10</p>
                  <Badge variant="outline" className="mt-2">
                    Pending
                  </Badge>
                </div>
                <div className="p-3 border rounded-lg opacity-60">
                  <h4 className="font-medium text-sm">Mid-term Evaluation</h4>
                  <p className="text-xs text-muted-foreground">All Courses</p>
                  <Badge variant="secondary" className="mt-2">
                    Completed
                  </Badge>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full mt-4 bg-transparent"
                size="sm"
                onClick={() => router.push("/classrooms/tools/surveys")}
              >
                View All Surveys
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
