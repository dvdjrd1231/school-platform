"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { BarChart3, TrendingUp, Users, Clock } from "lucide-react"

const classProgress = [
  {
    student: "Alice Johnson",
    overallProgress: 85,
    assignments: { completed: 8, total: 10 },
    quizzes: { completed: 5, total: 6 },
    lastActivity: "2 hours ago",
    status: "On Track",
  },
  {
    student: "Bob Smith",
    overallProgress: 72,
    assignments: { completed: 7, total: 10 },
    quizzes: { completed: 4, total: 6 },
    lastActivity: "1 day ago",
    status: "Needs Attention",
  },
  {
    student: "Carol Davis",
    overallProgress: 94,
    assignments: { completed: 9, total: 10 },
    quizzes: { completed: 6, total: 6 },
    lastActivity: "30 minutes ago",
    status: "Excellent",
  },
]

export default function ClassProgressPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Class Progress</h1>
          <p className="text-gray-600 mt-2">Monitor student progress and performance</p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Class Average</p>
                  <p className="text-2xl font-bold text-gray-900">83.7%</p>
                </div>
                <BarChart3 className="h-8 w-8 text-emerald-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Students On Track</p>
                  <p className="text-2xl font-bold text-gray-900">24/28</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Students</p>
                  <p className="text-2xl font-bold text-gray-900">26</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg. Time Spent</p>
                  <p className="text-2xl font-bold text-gray-900">4.2h</p>
                </div>
                <Clock className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Student Progress List */}
        <Card>
          <CardHeader>
            <CardTitle>Individual Student Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {classProgress.map((student, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{student.student}</h3>
                      <p className="text-sm text-gray-600">Last active: {student.lastActivity}</p>
                    </div>
                    <Badge
                      variant={
                        student.status === "Excellent"
                          ? "default"
                          : student.status === "On Track"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {student.status}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Overall Progress</span>
                        <span>{student.overallProgress}%</span>
                      </div>
                      <Progress value={student.overallProgress} className="h-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Assignments: </span>
                        <span className="font-medium">
                          {student.assignments.completed}/{student.assignments.total}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Quizzes: </span>
                        <span className="font-medium">
                          {student.quizzes.completed}/{student.quizzes.total}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
