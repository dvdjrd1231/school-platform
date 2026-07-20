import { Target, Award, BarChart3 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

export default function SkillsReportPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Skills Report</h1>
        <p className="text-gray-600">Track your skill development and competencies</p>
      </div>

      {/* Skills Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Overall Skills Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600 mb-2">85%</div>
            <Progress value={85} className="h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Skills Mastered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 mb-2">12</div>
            <p className="text-sm text-gray-600">Out of 18 total skills</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Improvement Areas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600 mb-2">6</div>
            <p className="text-sm text-gray-600">Skills to develop</p>
          </CardContent>
        </Card>
      </div>

      {/* Skills Categories */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-emerald-600" />
              <span>Technical Skills</span>
            </CardTitle>
            <CardDescription>Programming and technical competencies</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">Mathematics & Statistics</span>
                    <Badge variant="secondary">Advanced</Badge>
                  </div>
                  <Progress value={92} className="h-2" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">Data Analysis</span>
                    <Badge variant="secondary">Proficient</Badge>
                  </div>
                  <Progress value={78} className="h-2" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">Programming</span>
                    <Badge variant="outline">Developing</Badge>
                  </div>
                  <Progress value={65} className="h-2" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-emerald-600" />
              <span>Soft Skills</span>
            </CardTitle>
            <CardDescription>Communication and interpersonal abilities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">Written Communication</span>
                    <Badge variant="secondary">Advanced</Badge>
                  </div>
                  <Progress value={88} className="h-2" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">Teamwork</span>
                    <Badge variant="secondary">Proficient</Badge>
                  </div>
                  <Progress value={82} className="h-2" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">Leadership</span>
                    <Badge variant="outline">Developing</Badge>
                  </div>
                  <Progress value={70} className="h-2" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-emerald-600" />
              <span>Skills Development Timeline</span>
            </CardTitle>
            <CardDescription>Your progress over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium text-green-800">Mathematics Mastery Achieved</p>
                  <p className="text-sm text-green-600">Completed advanced calculus with 95% score</p>
                  <p className="text-xs text-gray-500">2 weeks ago</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium text-blue-800">Communication Skills Improved</p>
                  <p className="text-sm text-blue-600">Presentation skills workshop completed</p>
                  <p className="text-xs text-gray-500">1 month ago</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium text-purple-800">Data Analysis Certification</p>
                  <p className="text-sm text-purple-600">Earned certificate in statistical analysis</p>
                  <p className="text-xs text-gray-500">2 months ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
