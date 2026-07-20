"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, User, Phone, Mail, MapPin, BookOpen, GraduationCap } from "lucide-react"
import { useState } from "react"

export default function AdvisingSupportPage() {
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [selectedAdvisor, setSelectedAdvisor] = useState<any>(null)
  const [appointmentDate, setAppointmentDate] = useState("")
  const [appointmentTime, setAppointmentTime] = useState("")
  const [appointmentReason, setAppointmentReason] = useState("")

  const advisors = [
    {
      id: 1,
      name: "Dr. Sarah Johnson",
      title: "Academic Advisor",
      department: "General Studies",
      email: "s.johnson@maatk12.edu",
      phone: "(555) 123-4567",
      office: "Academic Center 201",
      hours: "Mon-Fri 9:00 AM - 5:00 PM",
      specialties: ["Degree Planning", "Course Selection", "Academic Policies"],
    },
    {
      id: 2,
      name: "Prof. Michael Chen",
      title: "Career Advisor",
      department: "Career Services",
      email: "m.chen@maatk12.edu",
      phone: "(555) 123-4568",
      office: "Career Center 105",
      hours: "Mon-Thu 10:00 AM - 6:00 PM",
      specialties: ["Career Planning", "Internships", "Job Search"],
    },
  ]

  const upcomingWorkshops = [
    {
      id: 1,
      title: "Degree Planning Workshop",
      date: "March 15, 2024",
      time: "2:00 PM - 3:30 PM",
      location: "Student Center Room 204",
      description: "Learn how to plan your academic path and choose the right courses.",
    },
    {
      id: 2,
      title: "Study Abroad Information Session",
      date: "March 22, 2024",
      time: "1:00 PM - 2:00 PM",
      location: "International Office",
      description: "Explore study abroad opportunities and application processes.",
    },
  ]

  const handleScheduleMeeting = (advisor: any) => {
    setSelectedAdvisor(advisor)
    setShowScheduleModal(true)
  }

  const submitAppointment = () => {
    console.log("[v0] Scheduling appointment with:", selectedAdvisor?.name, {
      date: appointmentDate,
      time: appointmentTime,
      reason: appointmentReason,
    })
    alert(`Appointment scheduled with ${selectedAdvisor?.name} on ${appointmentDate} at ${appointmentTime}!`)
    setShowScheduleModal(false)
    setAppointmentDate("")
    setAppointmentTime("")
    setAppointmentReason("")
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Advising Support</h1>
        <p className="text-gray-600 mt-2">
          Get personalized academic guidance and support for your educational journey
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <Calendar className="h-12 w-12 text-emerald-600 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Schedule Appointment</h3>
            <p className="text-sm text-gray-600 mb-4">Book a one-on-one session with an advisor</p>
            <Button className="bg-emerald-600 hover:bg-emerald-700">Book Now</Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <BookOpen className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Degree Audit</h3>
            <p className="text-sm text-gray-600 mb-4">Review your progress toward graduation</p>
            <Button variant="outline">View Audit</Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <GraduationCap className="h-12 w-12 text-purple-600 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Academic Planning</h3>
            <p className="text-sm text-gray-600 mb-4">Plan your course schedule and requirements</p>
            <Button variant="outline">Start Planning</Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Academic Advisors */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Academic Advisors</h2>
          <div className="space-y-6">
            {advisors.map((advisor) => (
              <Card key={advisor.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <User className="h-6 w-6 text-emerald-600" />
                    <div>
                      <h3 className="text-lg">{advisor.name}</h3>
                      <p className="text-sm text-gray-600 font-normal">{advisor.title}</p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <a href={`mailto:${advisor.email}`} className="text-emerald-600 hover:underline">
                        {advisor.email}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span>{advisor.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span>{advisor.office}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span>{advisor.hours}</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Specialties:</p>
                    <div className="flex flex-wrap gap-2">
                      {advisor.specialties.map((specialty, index) => (
                        <Badge key={index} variant="secondary">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => handleScheduleMeeting(advisor)}
                    >
                      Schedule Meeting
                    </Button>
                    <Button size="sm" variant="outline">
                      <a href={`mailto:${advisor.email}`}>Send Email</a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Upcoming Workshops */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Upcoming Workshops</h2>
          <div className="space-y-6">
            {upcomingWorkshops.map((workshop) => (
              <Card key={workshop.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{workshop.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>{workshop.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>{workshop.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span>{workshop.location}</span>
                  </div>
                  <p className="text-sm text-gray-600">{workshop.description}</p>
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                    Register
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Resources */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Additional Resources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <a href="/campus/resources/calendar" className="block text-emerald-600 hover:underline text-sm">
                  Academic Calendar
                </a>
                <a href="/campus/resources/catalog" className="block text-emerald-600 hover:underline text-sm">
                  Course Catalog
                </a>
                <a href="/campus/resources/requirements" className="block text-emerald-600 hover:underline text-sm">
                  Graduation Requirements
                </a>
                <a href="/campus/resources/policies" className="block text-emerald-600 hover:underline text-sm">
                  Academic Policies
                </a>
                <a href="/campus/resources/transfer" className="block text-emerald-600 hover:underline text-sm">
                  Transfer Credit Information
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Schedule Appointment with {selectedAdvisor?.name}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Date</label>
                <input
                  type="date"
                  className="w-full p-2 border rounded-md"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Time</label>
                <input
                  type="time"
                  className="w-full p-2 border rounded-md"
                  value={appointmentTime}
                  onChange={(e) => setAppointmentTime(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Reason for Appointment</label>
                <textarea
                  className="w-full p-2 border rounded-md h-20"
                  placeholder="Brief description of what you'd like to discuss..."
                  value={appointmentReason}
                  onChange={(e) => setAppointmentReason(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button onClick={submitAppointment} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                Schedule Appointment
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
