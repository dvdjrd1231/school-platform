"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Plus, BarChart3, Users, Clock } from "lucide-react"

const surveys = [
  {
    id: 1,
    title: "Course Feedback Survey",
    description: "Help us improve the course content and delivery",
    status: "Active",
    responses: 18,
    totalStudents: 28,
    endDate: "2024-02-15",
    type: "Feedback",
  },
  {
    id: 2,
    title: "Learning Style Assessment",
    description: "Understand your preferred learning methods",
    status: "Draft",
    responses: 0,
    totalStudents: 28,
    endDate: "2024-02-20",
    type: "Assessment",
  },
  {
    id: 3,
    title: "Mid-term Course Evaluation",
    description: "Evaluate course progress and satisfaction",
    status: "Completed",
    responses: 25,
    totalStudents: 28,
    endDate: "2024-01-30",
    type: "Evaluation",
  },
]

export default function SurveysPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Surveys</h1>
            <p className="text-gray-600 mt-2">Create and manage course surveys and assessments</p>
          </div>
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4 mr-2" />
            Create Survey
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Surveys</p>
                  <p className="text-2xl font-bold text-gray-900">1</p>
                </div>
                <BarChart3 className="h-8 w-8 text-emerald-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Responses</p>
                  <p className="text-2xl font-bold text-gray-900">43</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Response Rate</p>
                  <p className="text-2xl font-bold text-gray-900">76%</p>
                </div>
                <Clock className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Surveys List */}
        <div className="space-y-6">
          {surveys.map((survey) => (
            <Card key={survey.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">{survey.title}</CardTitle>
                    <p className="text-gray-600 mt-1">{survey.description}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={
                        survey.status === "Active" ? "default" : survey.status === "Draft" ? "secondary" : "outline"
                      }
                    >
                      {survey.status}
                    </Badge>
                    <Badge variant="outline">{survey.type}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Response Rate</span>
                      <span>
                        {survey.responses}/{survey.totalStudents} (
                        {Math.round((survey.responses / survey.totalStudents) * 100)}%)
                      </span>
                    </div>
                    <Progress value={(survey.responses / survey.totalStudents) * 100} className="h-2" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">End Date: {survey.endDate}</div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        View Results
                      </Button>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                      {survey.status === "Active" && (
                        <Button variant="outline" size="sm">
                          Share
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
