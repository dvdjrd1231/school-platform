"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { User, Mail, Phone, MapPin, BookOpen, Star, MessageSquare } from "lucide-react"
import { getInstructors } from "@/lib/database"

export default function InstructorPage() {
  const [instructors, setInstructors] = useState<any[]>([])
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [selectedInstructor, setSelectedInstructor] = useState<any>(null)
  const [message, setMessage] = useState("")
  const [meetingDate, setMeetingDate] = useState("")
  const [meetingTime, setMeetingTime] = useState("")

  useEffect(() => {
    setInstructors(getInstructors())
  }, [])

  const handleSendMessage = (instructor: any) => {
    setSelectedInstructor(instructor)
    setShowMessageModal(true)
  }

  const handleScheduleMeeting = (instructor: any) => {
    setSelectedInstructor(instructor)
    setShowScheduleModal(true)
  }

  const submitMessage = () => {
    console.log("[v0] Sending message to:", selectedInstructor?.name, "Message:", message)
    alert(`Message sent to ${selectedInstructor?.name}!`)
    setShowMessageModal(false)
    setMessage("")
  }

  const submitMeeting = () => {
    console.log("[v0] Scheduling meeting with:", selectedInstructor?.name, "Date:", meetingDate, "Time:", meetingTime)
    alert(`Meeting scheduled with ${selectedInstructor?.name} on ${meetingDate} at ${meetingTime}!`)
    setShowScheduleModal(false)
    setMeetingDate("")
    setMeetingTime("")
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-emerald-600">Instructor Profiles</h1>
        <p className="text-muted-foreground">Connect with your course instructors</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {instructors.map((instructor) => (
          <Card key={instructor.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="h-10 w-10 text-emerald-600" />
              </div>
              <CardTitle className="text-xl">{instructor.name}</CardTitle>
              <p className="text-muted-foreground">{instructor.title}</p>
              <div className="flex items-center justify-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm">{instructor.rating}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{instructor.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{instructor.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{instructor.office}</span>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Courses
                </h4>
                <div className="flex flex-wrap gap-1">
                  {instructor.courses.map((course: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {course}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Button className="w-full" size="sm" onClick={() => handleSendMessage(instructor)}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
                <Button
                  variant="outline"
                  className="w-full bg-transparent"
                  size="sm"
                  onClick={() => handleScheduleMeeting(instructor)}
                >
                  Schedule Meeting
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {showMessageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Send Message to {selectedInstructor?.name}</h3>
            <textarea
              className="w-full p-3 border rounded-md h-32 mb-4"
              placeholder="Type your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <div className="flex gap-2">
              <Button onClick={submitMessage} className="flex-1">
                Send Message
              </Button>
              <Button variant="outline" onClick={() => setShowMessageModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Schedule Meeting with {selectedInstructor?.name}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Date</label>
                <input
                  type="date"
                  className="w-full p-2 border rounded-md"
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Time</label>
                <input
                  type="time"
                  className="w-full p-2 border rounded-md"
                  value={meetingTime}
                  onChange={(e) => setMeetingTime(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button onClick={submitMeeting} className="flex-1">
                Schedule Meeting
              </Button>
              <Button variant="outline" onClick={() => setShowScheduleModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
