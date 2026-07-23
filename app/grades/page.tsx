import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, TrendingDown, Minus, Award, BookOpen, PenTool, MessageSquare } from "lucide-react"

export default function GradesPage() {
  const courses = [
    {
      id: 1,
      name: "Mathematics",
      code: "MATH101",
      currentGrade: 92,
      letterGrade: "A-",
      trend: "up",
      categories: [
        { name: "Assignments", weight: 40, score: 94, points: "188/200" },
        { name: "Quizzes", weight: 30, score: 88, points: "176/200" },
        { name: "Participation", weight: 20, score: 95, points: "95/100" },
        { name: "Final Project", weight: 10, score: 90, points: "90/100" },
      ],
      recentGrades: [
        { item: "Quiz 5: Algebra", score: 95, date: "2024-01-15", type: "quiz" },
        { item: "Assignment 8: Word Problems", score: 88, date: "2024-01-12", type: "assignment" },
        { item: "Quiz 4: Geometry", score: 92, date: "2024-01-08", type: "quiz" },
      ],
    },
    {
      id: 2,
      name: "English Literature",
      code: "ENG201",
      currentGrade: 87,
      letterGrade: "B+",
      trend: "up",
      categories: [
        { name: "Essays", weight: 50, score: 85, points: "340/400" },
        { name: "Reading Quizzes", weight: 25, score: 90, points: "180/200" },
        { name: "Class Discussion", weight: 15, score: 88, points: "88/100" },
        { name: "Final Exam", weight: 10, score: 92, points: "92/100" },
      ],
      recentGrades: [
        { item: "Essay: Character Analysis", score: 89, date: "2024-01-14", type: "assignment" },
        { item: "Reading Quiz: Chapter 5-6", score: 94, date: "2024-01-10", type: "quiz" },
        { item: "Discussion: Theme Analysis", score: 85, date: "2024-01-08", type: "participation" },
      ],
    },
    {
      id: 3,
      name: "Science",
      code: "SCI101",
      currentGrade: 79,
      letterGrade: "C+",
      trend: "down",
      categories: [
        { name: "Lab Reports", weight: 35, score: 82, points: "164/200" },
        { name: "Tests", weight: 40, score: 75, points: "225/300" },
        { name: "Homework", weight: 15, score: 85, points: "85/100" },
        { name: "Projects", weight: 10, score: 78, points: "78/100" },
      ],
      recentGrades: [
        { item: "Test: Chemical Reactions", score: 72, date: "2024-01-13", type: "test" },
        { item: "Lab Report: pH Testing", score: 85, date: "2024-01-09", type: "assignment" },
        { item: "Homework: Chapter 4", score: 88, date: "2024-01-07", type: "assignment" },
      ],
    },
  ]

  const overallGPA = 3.2
  const semesterGPA = 3.4

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  const getGradeColor = (score: number) => {
    if (score >= 90) return "text-green-600"
    if (score >= 80) return "text-blue-600"
    if (score >= 70) return "text-yellow-600"
    return "text-red-600"
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "quiz":
        return <PenTool className="h-4 w-4" />
      case "assignment":
        return <BookOpen className="h-4 w-4" />
      case "test":
        return <Award className="h-4 w-4" />
      case "participation":
        return <MessageSquare className="h-4 w-4" />
      default:
        return <BookOpen className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Grades</h1>
          <p className="text-gray-600">Track your academic progress and performance</p>
        </div>
        <div className="flex gap-4">
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">{overallGPA}</div>
              <div className="text-sm text-gray-600">Overall GPA</div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">{semesterGPA}</div>
              <div className="text-sm text-gray-600">Semester GPA</div>
            </div>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="detailed">Detailed View</TabsTrigger>
          <TabsTrigger value="trends">Grade Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6">
            {courses.map((course) => (
              <Card key={course.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {course.name}
                        <Badge variant="outline">{course.code}</Badge>
                      </CardTitle>
                      <CardDescription>Current Grade Performance</CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <span className={`text-2xl font-bold ${getGradeColor(course.currentGrade)}`}>
                          {course.currentGrade}%
                        </span>
                        <Badge variant="secondary">{course.letterGrade}</Badge>
                        {getTrendIcon(course.trend)}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Progress value={course.currentGrade} className="h-2" />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {course.categories.map((category, index) => (
                        <div key={index} className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm font-medium text-gray-600">{category.name}</div>
                          <div className={`text-lg font-bold ${getGradeColor(category.score)}`}>{category.score}%</div>
                          <div className="text-xs text-gray-500">
                            {category.points} ({category.weight}%)
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-6">
          {courses.map((course) => (
            <Card key={course.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {course.name}
                  <Badge variant="outline">{course.code}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <h4 className="font-semibold">Recent Grades</h4>
                  <div className="space-y-2">
                    {course.recentGrades.map((grade, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {getTypeIcon(grade.type)}
                          <div>
                            <div className="font-medium">{grade.item}</div>
                            <div className="text-sm text-gray-600">{grade.date}</div>
                          </div>
                        </div>
                        <div className={`text-lg font-bold ${getGradeColor(grade.score)}`}>{grade.score}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Grade Trends</CardTitle>
              <CardDescription>Your academic performance over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {courses.map((course) => (
                  <div key={course.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{course.name}</span>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${getGradeColor(course.currentGrade)}`}>
                          {course.currentGrade}%
                        </span>
                        {getTrendIcon(course.trend)}
                      </div>
                    </div>
                    <Progress value={course.currentGrade} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
