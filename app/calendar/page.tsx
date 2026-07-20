"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, ChevronLeft, ChevronRight, Plus, Clock, MapPin, Users, BookOpen, FileText } from "lucide-react"

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState("month")

  const events = [
    {
      id: 1,
      title: "Mathematics Quiz",
      type: "quiz",
      date: "2024-01-15",
      time: "10:00 AM",
      class: "Mathematics 101",
      location: "Room 205",
    },
    {
      id: 2,
      title: "English Essay Due",
      type: "assignment",
      date: "2024-01-18",
      time: "11:59 PM",
      class: "English Literature",
      location: "Online Submission",
    },
    {
      id: 3,
      title: "Biology Lab",
      type: "lab",
      date: "2024-01-20",
      time: "2:00 PM",
      class: "Biology Fundamentals",
      location: "Lab 101",
    },
    {
      id: 4,
      title: "History Presentation",
      type: "presentation",
      date: "2024-01-22",
      time: "1:00 PM",
      class: "World History",
      location: "Room 402",
    },
    {
      id: 5,
      title: "Parent-Teacher Conference",
      type: "meeting",
      date: "2024-01-25",
      time: "3:30 PM",
      class: "General",
      location: "Main Office",
    },
  ]

  const getEventIcon = (type: string) => {
    switch (type) {
      case "quiz":
        return <FileText className="h-4 w-4" />
      case "assignment":
        return <BookOpen className="h-4 w-4" />
      case "lab":
        return <Users className="h-4 w-4" />
      case "presentation":
        return <Users className="h-4 w-4" />
      case "meeting":
        return <Users className="h-4 w-4" />
      default:
        return <CalendarIcon className="h-4 w-4" />
    }
  }

  const getEventColor = (type: string) => {
    switch (type) {
      case "quiz":
        return "bg-red-100 text-red-800"
      case "assignment":
        return "bg-blue-100 text-blue-800"
      case "lab":
        return "bg-green-100 text-green-800"
      case "presentation":
        return "bg-purple-100 text-purple-800"
      case "meeting":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()

  const navigateMonth = (direction: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
          <p className="text-gray-600 mt-1">View your schedule and upcoming events</p>
        </div>
        <div className="flex gap-2">
          <Select value={view} onValueChange={setView}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="day">Day</SelectItem>
            </SelectContent>
          </Select>
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Event
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </CardTitle>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" onClick={() => navigateMonth(-1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigateMonth(1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 mb-4">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="p-2 text-center text-sm font-medium text-gray-600">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for days before the first day of the month */}
              {Array.from({ length: firstDayOfMonth }, (_, i) => (
                <div key={`empty-${i}`} className="p-2 h-24"></div>
              ))}

              {/* Days of the month */}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1
                const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                const dayEvents = events.filter((event) => event.date === dateStr)

                return (
                  <div key={day} className="p-1 h-24 border border-gray-200 rounded">
                    <div className="text-sm font-medium mb-1">{day}</div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 2).map((event) => (
                        <div key={event.id} className={`text-xs p-1 rounded truncate ${getEventColor(event.type)}`}>
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-gray-500">+{dayEvents.length - 2} more</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>Next 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {events.slice(0, 5).map((event) => (
                <div key={event.id} className="p-3 border rounded-lg">
                  <div className="flex items-start gap-2">
                    <div className={`p-1 rounded ${getEventColor(event.type)}`}>{getEventIcon(event.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{event.title}</div>
                      <div className="text-xs text-gray-600">{event.class}</div>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                        <Clock className="h-3 w-3" />
                        {event.time}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <MapPin className="h-3 w-3" />
                        {event.location}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Event Types Legend */}
      <Card>
        <CardHeader>
          <CardTitle>Event Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Badge className="bg-red-100 text-red-800">Quiz</Badge>
              <span className="text-sm">Quizzes and Tests</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-100 text-blue-800">Assignment</Badge>
              <span className="text-sm">Homework and Projects</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-green-100 text-green-800">Lab</Badge>
              <span className="text-sm">Laboratory Sessions</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-purple-100 text-purple-800">Presentation</Badge>
              <span className="text-sm">Student Presentations</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-yellow-100 text-yellow-800">Meeting</Badge>
              <span className="text-sm">Conferences and Meetings</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
