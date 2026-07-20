"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Mail, MessageSquare } from "lucide-react"
import { useState } from "react"

const students = [
  {
    id: 1,
    name: "Alice Johnson",
    email: "alice.johnson@student.maat.edu",
    phone: "(555) 123-4567",
    status: "Active",
    enrollmentDate: "2024-01-15",
    grade: "A",
    attendance: "95%",
  },
  {
    id: 2,
    name: "Bob Smith",
    email: "bob.smith@student.maat.edu",
    phone: "(555) 234-5678",
    status: "Active",
    enrollmentDate: "2024-01-15",
    grade: "B+",
    attendance: "88%",
  },
  {
    id: 3,
    name: "Carol Davis",
    email: "carol.davis@student.maat.edu",
    phone: "(555) 345-6789",
    status: "Active",
    enrollmentDate: "2024-01-15",
    grade: "A-",
    attendance: "97%",
  },
]

export default function ClassListPage() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Class List</h1>
          <p className="text-gray-600 mt-2">View and manage your class roster</p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Students List */}
        <div className="grid gap-4">
          {filteredStudents.map((student) => (
            <Card key={student.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                      <span className="text-emerald-600 font-semibold text-lg">
                        {student.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{student.name}</h3>
                      <p className="text-sm text-gray-600">{student.email}</p>
                      <p className="text-sm text-gray-600">{student.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge variant="secondary">Grade: {student.grade}</Badge>
                        <Badge variant="outline">Attendance: {student.attendance}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">Enrolled: {student.enrollmentDate}</p>
                    </div>

                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Mail className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
