import { Target, BookOpen, Users, Calendar, TrendingUp, Award } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function SuccessCenterPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Success Center</h1>
        <p className="text-gray-600">Resources and support for academic excellence</p>
      </div>

      {/* Services Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center space-x-2">
              <Target className="h-5 w-5 text-emerald-600" />
              <span>Tutoring</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-3">One-on-one and group tutoring sessions</p>
            <Button size="sm" className="w-full">
              Schedule Session
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-emerald-600" />
              <span>Study Skills</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-3">Workshops on effective study techniques</p>
            <Button size="sm" className="w-full">
              View Workshops
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center space-x-2">
              <Users className="h-5 w-5 text-emerald-600" />
              <span>Peer Support</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-3">Connect with study groups and mentors</p>
            <Button size="sm" className="w-full">
              Join Groups
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Available Services */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Available Services</CardTitle>
              <CardDescription>Comprehensive academic support options</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Mathematics Tutoring</h4>
                    <Badge variant="secondary">Available</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Expert help with calculus, algebra, and statistics</p>
                  <Button size="sm">Book Session</Button>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Writing Center</h4>
                    <Badge variant="secondary">Available</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Essay review, grammar help, and writing workshops</p>
                  <Button size="sm">Schedule Appointment</Button>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Study Skills Workshop</h4>
                    <Badge variant="outline">Next: Dec 15</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Time management and effective study strategies</p>
                  <Button size="sm">Register</Button>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Test Prep Support</h4>
                    <Badge variant="secondary">Available</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Preparation for standardized tests and exams</p>
                  <Button size="sm">Learn More</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* My Progress & Upcoming */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
                <span>My Progress</span>
              </CardTitle>
              <CardDescription>Track your academic improvement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Award className="h-5 w-5 text-green-600" />
                    <div>
                      <h4 className="font-medium text-green-800">Mathematics Improvement</h4>
                      <p className="text-sm text-green-600">Grade improved from C+ to A- this semester</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                    <div>
                      <h4 className="font-medium text-blue-800">Writing Skills</h4>
                      <p className="text-sm text-blue-600">Completed 5 writing center sessions</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5 text-purple-600" />
                    <div>
                      <h4 className="font-medium text-purple-800">Study Group Participation</h4>
                      <p className="text-sm text-purple-600">Active member of 2 study groups</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-emerald-600" />
                <span>Upcoming Sessions</span>
              </CardTitle>
              <CardDescription>Your scheduled appointments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                  <div>
                    <h5 className="font-medium text-emerald-800">Math Tutoring</h5>
                    <p className="text-sm text-emerald-600">Today, 2:00 PM - Room 105</p>
                  </div>
                  <Button size="sm" variant="outline">
                    Reschedule
                  </Button>
                </div>

                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <h5 className="font-medium text-blue-800">Writing Center</h5>
                    <p className="text-sm text-blue-600">Dec 12, 10:00 AM - Online</p>
                  </div>
                  <Button size="sm" variant="outline">
                    Join Session
                  </Button>
                </div>

                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div>
                    <h5 className="font-medium text-purple-800">Study Skills Workshop</h5>
                    <p className="text-sm text-purple-600">Dec 15, 1:00 PM - Library</p>
                  </div>
                  <Button size="sm" variant="outline">
                    View Details
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
