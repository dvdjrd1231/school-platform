"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, ChevronLeft, ChevronRight, Plus, Clock, MapPin } from "lucide-react"
import { useRole } from "@/components/context/role-context"

export default function ClassroomCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const { isTeacher, isAdmin } = useRole()

  const events = [
    {
      id: 1,
      title: "Math Quiz - Chapter 3",
      date: "2024-03-15",
      time: "10:00 AM",
      type: "quiz",
      location: "Room 205",
      description: "Algebra fundamentals quiz covering chapters 1-3",
    },
    {
      id: 2,
      title: "English Essay Due",
      date: "2024-03-16",
      time: "11:59 PM",
      type: "assignment",
      location: "Online Submission",
      description: "Shakespeare analysis essay - 1000 words",
    },
    {
      id: 3,
      title: "Science Lab Session",
      date: "2024-03-18",
      time: "2:00 PM",
      type: "lab",
      location: "Science Lab B",
      description: "Chemistry experiments - acids and bases",
    },
    {
      id: 4,
      title: "Parent-Teacher Conference",
      date: "2024-03-20",
      time: "3:00 PM",
      type: "meeting",
      location: "Conference Room",
      description: "Quarterly progress review meeting",
    },
  ]

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "quiz":
        return "bg-red-100 text-red-800"
      case "assignment":
        return "bg-blue-100 text-blue-800"
      case "lab":
        return "bg-green-100 text-green-800"
      case "meeting":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Classroom Calendar</h1>
            <p className="text-gray-600 mt-2">Mathematics - Grade 10</p>
          </div>
          {(isTeacher || isAdmin) && (
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar View */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  March 2024
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
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
                  const hasEvent = isCurrentMonth && events.some((event) => new Date(event.date).getDate() === day)

                  return (
                    <div
                      key={i}
                      className={`aspect-square p-2 text-center text-sm border rounded-lg cursor-pointer hover:bg-gray-50 ${
                        isCurrentMonth ? "text-gray-900" : "text-gray-300"
                      } ${hasEvent ? "bg-emerald-50 border-emerald-200" : ""}`}
                    >
                      {isCurrentMonth ? day : ""}
                      {hasEvent && <div className="w-2 h-2 bg-emerald-500 rounded-full mx-auto mt-1"></div>}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Events */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {events.map((event) => (
                <div key={event.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-sm">{event.title}</h3>
                    <Badge className={getEventTypeColor(event.type)}>{event.type}</Badge>
                  </div>
                  <div className="space-y-1 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(event.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span>{event.location}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">{event.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
