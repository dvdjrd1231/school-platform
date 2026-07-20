import { GraduationCap, CheckCircle, Circle, Clock } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

export default function DegreePlanPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Degree Plan</h1>
        <p className="text-gray-600">Track your progress toward graduation</p>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Overall Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Progress value={68} className="h-2" />
              <p className="text-sm text-gray-600">82 of 120 credits completed</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">GPA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">3.7</div>
            <p className="text-sm text-gray-600">Cumulative GPA</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Expected Graduation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">Spring 2025</div>
            <p className="text-sm text-gray-600">On track</p>
          </CardContent>
        </Card>
      </div>

      {/* Degree Requirements */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <GraduationCap className="h-5 w-5 text-emerald-600" />
              <span>Core Requirements</span>
            </CardTitle>
            <CardDescription>Essential courses for your degree</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <h4 className="font-medium">Mathematics Foundation</h4>
                    <p className="text-sm text-gray-600">MATH 101, 102, 201</p>
                  </div>
                </div>
                <Badge variant="secondary">Completed</Badge>
              </div>

              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <div>
                    <h4 className="font-medium">Advanced Mathematics</h4>
                    <p className="text-sm text-gray-600">MATH 301, 302</p>
                  </div>
                </div>
                <Badge variant="outline">In Progress</Badge>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Circle className="h-5 w-5 text-gray-400" />
                  <div>
                    <h4 className="font-medium">Senior Capstone</h4>
                    <p className="text-sm text-gray-600">MATH 499</p>
                  </div>
                </div>
                <Badge variant="outline">Planned</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Electives</CardTitle>
            <CardDescription>Choose courses that interest you</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <h4 className="font-medium">Computer Science Electives</h4>
                    <p className="text-sm text-gray-600">CS 201, CS 301</p>
                  </div>
                </div>
                <Badge variant="secondary">6 credits</Badge>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Circle className="h-5 w-5 text-gray-400" />
                  <div>
                    <h4 className="font-medium">Free Electives</h4>
                    <p className="text-sm text-gray-600">Any 300+ level courses</p>
                  </div>
                </div>
                <Badge variant="outline">12 credits needed</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
