"use client"

import { Calendar, Users, BookOpen, Megaphone, ExternalLink, Clock, TrendingUp } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"

export default function CampusHomePage() {
  const router = useRouter()

  const handleClassClick = (className: string) => {
    router.push("/classrooms")
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-lg p-8 text-white mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome to Campus Portal</h1>
        <p className="text-emerald-100 text-lg">Your gateway to academic success and campus life</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Classes Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5 text-emerald-600" />
                  <span>My Classes</span>
                </CardTitle>
                <CardDescription>Current, past, and upcoming courses</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Current Classes */}
                <div>
                  <h4 className="font-semibold text-emerald-600 mb-3">Current Semester</h4>
                  <div className="space-y-3">
                    <div
                      className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg cursor-pointer hover:bg-emerald-100 transition-colors"
                      onClick={() => handleClassClick("Advanced Mathematics")}
                    >
                      <div>
                        <h5 className="font-medium">Advanced Mathematics</h5>
                        <p className="text-sm text-gray-600">MATH 301 • Prof. Johnson</p>
                      </div>
                      <Badge variant="secondary">In Progress</Badge>
                    </div>
                    <div
                      className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg cursor-pointer hover:bg-emerald-100 transition-colors"
                      onClick={() => handleClassClick("English Literature")}
                    >
                      <div>
                        <h5 className="font-medium">English Literature</h5>
                        <p className="text-sm text-gray-600">ENG 201 • Prof. Smith</p>
                      </div>
                      <Badge variant="secondary">In Progress</Badge>
                    </div>
                  </div>
                </div>

                {/* Upcoming Classes */}
                <div>
                  <h4 className="font-semibold text-blue-600 mb-3">Next Semester</h4>
                  <div className="space-y-3">
                    <div
                      className="flex items-center justify-between p-3 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
                      onClick={() => handleClassClick("Physics II")}
                    >
                      <div>
                        <h5 className="font-medium">Physics II</h5>
                        <p className="text-sm text-gray-600">PHYS 202 • Prof. Davis</p>
                      </div>
                      <Badge variant="outline">Registered</Badge>
                    </div>
                  </div>
                </div>

                {/* Past Classes */}
                <div>
                  <h4 className="font-semibold text-gray-600 mb-3">Completed</h4>
                  <div className="space-y-3">
                    <div
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleClassClick("Chemistry I")}
                    >
                      <div>
                        <h5 className="font-medium">Chemistry I</h5>
                        <p className="text-sm text-gray-600">CHEM 101 • Prof. Wilson</p>
                      </div>
                      <Badge variant="default">A-</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Streams */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
                <span>Activity Streams</span>
              </CardTitle>
              <CardDescription>Recent campus and academic activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm">
                      <strong>Assignment submitted</strong> for Advanced Mathematics
                    </p>
                    <p className="text-xs text-gray-500">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm">
                      <strong>New announcement</strong> from Prof. Smith
                    </p>
                    <p className="text-xs text-gray-500">1 day ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm">
                      <strong>Grade posted</strong> for Chemistry I final exam
                    </p>
                    <p className="text-xs text-gray-500">3 days ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Course Registration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-emerald-600" />
                <span>Course Registration</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-emerald-50 rounded-lg">
                  <p className="font-medium text-emerald-800">Spring 2024 Registration</p>
                  <p className="text-sm text-emerald-600">Opens December 1st</p>
                </div>
                <Button className="w-full">View Available Courses</Button>
              </div>
            </CardContent>
          </Card>

          {/* Announcements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Megaphone className="h-5 w-5 text-emerald-600" />
                <span>Announcements</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 border-l-4 border-red-500 bg-red-50">
                  <p className="font-medium text-red-800">Campus Closure</p>
                  <p className="text-sm text-red-600">December 23-31 for winter break</p>
                </div>
                <div className="p-3 border-l-4 border-blue-500 bg-blue-50">
                  <p className="font-medium text-blue-800">Library Hours Extended</p>
                  <p className="text-sm text-blue-600">Open 24/7 during finals week</p>
                </div>
                <div className="p-3 border-l-4 border-emerald-500 bg-emerald-50">
                  <p className="font-medium text-emerald-800">New Student Services</p>
                  <p className="text-sm text-emerald-600">Career counseling now available</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ExternalLink className="h-5 w-5 text-emerald-600" />
                <span>Quick Links</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="ghost" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  Academic Calendar
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Course Catalog
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Student Directory
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Clock className="h-4 w-4 mr-2" />
                  Campus Hours
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
