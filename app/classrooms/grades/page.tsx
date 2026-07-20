"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart3, TrendingUp, Award, FileText, Calculator } from "lucide-react"
import { getGrades, getCourses } from "@/lib/database"

export default function ClassroomGradesPage() {
  const [selectedCourse, setSelectedCourse] = useState("all")
  const grades = getGrades()
  const courses = getCourses()

  const calculateGPA = () => {
    const totalPoints = grades.reduce((sum, grade) => sum + (grade.points || 0), 0)
    const totalPossible = grades.reduce((sum, grade) => sum + (grade.totalPoints || 100), 0)
    return ((totalPoints / totalPossible) * 4.0).toFixed(2)
  }

  const getLetterGrade = (percentage: number) => {
    if (percentage >= 97) return "A+"
    if (percentage >= 93) return "A"
    if (percentage >= 90) return "A-"
    if (percentage >= 87) return "B+"
    if (percentage >= 83) return "B"
    if (percentage >= 80) return "B-"
    if (percentage >= 77) return "C+"
    if (percentage >= 73) return "C"
    if (percentage >= 70) return "C-"
    if (percentage >= 67) return "D+"
    if (percentage >= 65) return "D"
    return "F"
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Grades</h1>
        <p className="text-gray-600 mt-2">Track your academic progress and performance</p>
      </div>

      {/* GPA Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Current GPA</p>
                <p className="text-3xl font-bold text-emerald-600">{calculateGPA()}</p>
              </div>
              <Award className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Credits</p>
                <p className="text-3xl font-bold text-blue-600">24</p>
              </div>
              <Calculator className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Assignments</p>
                <p className="text-3xl font-bold text-purple-600">{grades.length}</p>
              </div>
              <FileText className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Trend</p>
                <p className="text-3xl font-bold text-green-600">↗</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="by-course">By Course</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Course Grades</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {courses.slice(0, 4).map((course) => {
                  const courseGrades = grades.filter((g) => g.courseId === course.id)
                  const avgGrade =
                    courseGrades.length > 0
                      ? courseGrades.reduce((sum, g) => sum + ((g.points || 0) / (g.totalPoints || 100)) * 100, 0) /
                        courseGrades.length
                      : 0

                  return (
                    <div key={course.id} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{course.name}</p>
                        <Progress value={avgGrade} className="mt-2" />
                      </div>
                      <div className="ml-4 text-right">
                        <Badge variant={avgGrade >= 90 ? "default" : avgGrade >= 80 ? "secondary" : "destructive"}>
                          {getLetterGrade(avgGrade)}
                        </Badge>
                        <p className="text-sm text-gray-500 mt-1">{avgGrade.toFixed(1)}%</p>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Grades</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {grades.slice(0, 5).map((grade) => {
                  const percentage = ((grade.points || 0) / (grade.totalPoints || 100)) * 100
                  return (
                    <div key={grade.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{grade.assignmentTitle}</p>
                        <p className="text-sm text-gray-500">{grade.courseName}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={percentage >= 90 ? "default" : percentage >= 80 ? "secondary" : "destructive"}>
                          {getLetterGrade(percentage)}
                        </Badge>
                        <p className="text-sm text-gray-500 mt-1">
                          {grade.points}/{grade.totalPoints}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="by-course" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {courses.map((course) => {
              const courseGrades = grades.filter((g) => g.courseId === course.id)
              const avgGrade =
                courseGrades.length > 0
                  ? courseGrades.reduce((sum, g) => sum + ((g.points || 0) / (g.totalPoints || 100)) * 100, 0) /
                    courseGrades.length
                  : 0

              return (
                <Card key={course.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {course.name}
                      <Badge variant={avgGrade >= 90 ? "default" : avgGrade >= 80 ? "secondary" : "destructive"}>
                        {getLetterGrade(avgGrade)}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Overall Grade</span>
                        <span>{avgGrade.toFixed(1)}%</span>
                      </div>
                      <Progress value={avgGrade} />
                    </div>

                    <div className="space-y-2">
                      {courseGrades.slice(0, 3).map((grade) => {
                        const percentage = ((grade.points || 0) / (grade.totalPoints || 100)) * 100
                        return (
                          <div key={grade.id} className="flex justify-between text-sm">
                            <span>{grade.assignmentTitle}</span>
                            <span className="font-medium">{percentage.toFixed(1)}%</span>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {grades.map((grade) => {
                  const percentage = ((grade.points || 0) / (grade.totalPoints || 100)) * 100
                  return (
                    <div key={grade.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{grade.assignmentTitle}</p>
                        <p className="text-sm text-gray-500">
                          {grade.courseName} • {grade.submittedAt}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant={percentage >= 90 ? "default" : percentage >= 80 ? "secondary" : "destructive"}>
                          {getLetterGrade(percentage)}
                        </Badge>
                        <p className="text-sm text-gray-500 mt-1">
                          {grade.points}/{grade.totalPoints} ({percentage.toFixed(1)}%)
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Grade Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Grade trend visualization coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
