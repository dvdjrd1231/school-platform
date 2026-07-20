"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Plus, Edit, Trash2, Clock, MapPin, Users } from "lucide-react"
import { useRole } from "@/components/context/role-context"

interface CalendarEvent {
  id: number
  title: string
  description: string
  date: string
  time: string
  type: "assignment" | "quiz" | "meeting" | "holiday" | "announcement"
  location?: string
  classId?: string
  createdBy: string
}

export default function AdminCalendarPage() {
  const { isAdmin } = useRole()
  const [events, setEvents] = useState<CalendarEvent[]>([
    {
      id: 1,
      title: "Math Quiz - Chapter 3",
      description: "Algebra fundamentals quiz covering chapters 1-3",
      date: "2024-03-15",
      time: "10:00",
      type: "quiz",
      location: "Room 205",
      classId: "math-101",
      createdBy: "admin",
    },
    {
      id: 2,
      title: "Spring Break",
      description: "No classes - Spring break holiday",
      date: "2024-03-25",
      time: "00:00",
      type: "holiday",
      createdBy: "admin",
    },
  ])

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    type: "announcement" as CalendarEvent["type"],
    location: "",
    classId: "",
  })

  const handleCreateEvent = () => {
    if (!isAdmin) return

    const event: CalendarEvent = {
      id: Math.max(...events.map((e) => e.id)) + 1,
      ...newEvent,
      createdBy: "admin",
    }

    setEvents([...events, event])
    setNewEvent({
      title: "",
      description: "",
      date: "",
      time: "",
      type: "announcement",
      location: "",
      classId: "",
    })
    setShowCreateForm(false)
  }

  const handleDeleteEvent = (id: number) => {
    if (!isAdmin) return
    setEvents(events.filter((e) => e.id !== id))
  }

  const getEventTypeColor = (type: CalendarEvent["type"]) => {
    switch (type) {
      case "quiz":
        return "bg-red-100 text-red-800"
      case "assignment":
        return "bg-blue-100 text-blue-800"
      case "meeting":
        return "bg-purple-100 text-purple-800"
      case "holiday":
        return "bg-green-100 text-green-800"
      case "announcement":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-2">Access Denied</h2>
            <p className="text-gray-600">Only administrators can manage calendar events.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Calendar Management</h1>
            <p className="text-gray-600 mt-2">Create and manage school-wide calendar events</p>
          </div>
          <Button onClick={() => setShowCreateForm(true)} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4 mr-2" />
            Create Event
          </Button>
        </div>
      </div>

      {/* Create Event Form */}
      {showCreateForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Create New Event</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Event Title</Label>
                <Input
                  id="title"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder="Enter event title"
                />
              </div>
              <div>
                <Label htmlFor="type">Event Type</Label>
                <Select
                  value={newEvent.type}
                  onValueChange={(value: CalendarEvent["type"]) => setNewEvent({ ...newEvent, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="announcement">Announcement</SelectItem>
                    <SelectItem value="assignment">Assignment</SelectItem>
                    <SelectItem value="quiz">Quiz/Test</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="holiday">Holiday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={newEvent.time}
                  onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="location">Location (Optional)</Label>
                <Input
                  id="location"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  placeholder="Enter location"
                />
              </div>
              <div>
                <Label htmlFor="classId">Class (Optional)</Label>
                <Input
                  id="classId"
                  value={newEvent.classId}
                  onChange={(e) => setNewEvent({ ...newEvent, classId: e.target.value })}
                  placeholder="Enter class ID"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                placeholder="Enter event description"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateEvent} className="bg-emerald-600 hover:bg-emerald-700">
                Create Event
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Events List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">All Events</h2>
        {events.map((event) => (
          <Card key={event.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">{event.title}</h3>
                    <Badge className={getEventTypeColor(event.type)}>{event.type}</Badge>
                  </div>
                  <p className="text-gray-600 mb-3">{event.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(event.date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {event.time}
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {event.location}
                      </div>
                    )}
                    {event.classId && (
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {event.classId}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteEvent(event.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
