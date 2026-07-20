import { Calendar, Clock, MapPin } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function SeminarSchedulePage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Seminar Schedule</h1>
        <p className="text-gray-600">Upcoming seminars and workshops</p>
      </div>

      {/* Calendar View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-emerald-600" />
                <span>December 2024</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2 mb-4">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="text-center text-sm font-medium text-gray-500 p-2">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 35 }, (_, i) => {
                  const day = i - 6 + 1
                  const isCurrentMonth = day > 0 && day <= 31
                  const hasEvent = [5, 12, 18, 25].includes(day)

                  return (
                    <div
                      key={i}
                      className={`
                        aspect-square flex items-center justify-center text-sm rounded-lg cursor-pointer
                        ${isCurrentMonth ? "text-gray-900" : "text-gray-300"}
                        ${hasEvent ? "bg-emerald-100 text-emerald-800 font-semibold" : "hover:bg-gray-100"}
                      `}
                    >
                      {isCurrentMonth ? day : ""}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Seminars</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border-l-4 border-emerald-500 bg-emerald-50 rounded-r-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-emerald-800">Career Development</h4>
                    <Badge variant="secondary">Today</Badge>
                  </div>
                  <div className="space-y-1 text-sm text-emerald-700">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>2:00 PM - 4:00 PM</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4" />
                      <span>Room 205</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 border-l-4 border-blue-500 bg-blue-50 rounded-r-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-blue-800">Research Methods</h4>
                    <Badge variant="outline">Dec 12</Badge>
                  </div>
                  <div className="space-y-1 text-sm text-blue-700">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>10:00 AM - 12:00 PM</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4" />
                      <span>Library Conference Room</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 border-l-4 border-purple-500 bg-purple-50 rounded-r-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-purple-800">Graduate School Prep</h4>
                    <Badge variant="outline">Dec 18</Badge>
                  </div>
                  <div className="space-y-1 text-sm text-purple-700">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>1:00 PM - 3:00 PM</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4" />
                      <span>Student Center</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>My Registered Seminars</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h5 className="font-medium">Career Development</h5>
                    <p className="text-sm text-gray-600">Today, 2:00 PM</p>
                  </div>
                  <Button size="sm" variant="outline">
                    View Details
                  </Button>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h5 className="font-medium">Research Methods</h5>
                    <p className="text-sm text-gray-600">Dec 12, 10:00 AM</p>
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
