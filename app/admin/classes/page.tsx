"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, Plus, Users, BookOpen, Calendar, Clock, MoreHorizontal, Edit, Trash2, UserPlus } from "lucide-react"
import { useRole } from "@/components/context/role-context"

export default function ClassManagement() {
  const { isAdmin } = useRole()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterGrade, setFilterGrade] = useState("all")
  const [filterSubject, setFilterSubject] = useState("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  useEffect(() => {
    if (!isAdmin) {
      router.push("/")
    }
  }, [isAdmin, router])

  if (!isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">Only administrators can access class management.</p>
          <Button onClick={() => router.push("/")}>Back to Home</Button>
        </div>
      </div>
    )
  }

  // Mock data for classes
  const classes = [
    {
      id: 1,
      name: "Mathematics 101",
      grade: "9th Grade",
      subject: "Mathematics",
      teacher: "Dr. Sarah Johnson",
      students: 28,
      capacity: 30,
      schedule: "Mon, Wed, Fri 9:00 AM",
      room: "Room 205",
      status: "Active",
    },
    {
      id: 2,
      name: "English Literature",
      grade: "10th Grade",
      subject: "English",
      teacher: "Prof. Michael Brown",
      students: 25,
      capacity: 25,
      schedule: "Tue, Thu 10:30 AM",
      room: "Room 301",
      status: "Full",
    },
    {
      id: 3,
      name: "Biology Fundamentals",
      grade: "9th Grade",
      subject: "Science",
      teacher: "Dr. Emily Davis",
      students: 22,
      capacity: 30,
      schedule: "Mon, Wed, Fri 2:00 PM",
      room: "Lab 101",
      status: "Active",
    },
    {
      id: 4,
      name: "World History",
      grade: "11th Grade",
      subject: "History",
      teacher: "Mr. James Wilson",
      students: 18,
      capacity: 25,
      schedule: "Tue, Thu 1:00 PM",
      room: "Room 402",
      status: "Active",
    },
    {
      id: 5,
      name: "Chemistry Advanced",
      grade: "12th Grade",
      subject: "Science",
      teacher: "Dr. Lisa Anderson",
      students: 15,
      capacity: 20,
      schedule: "Mon, Wed, Fri 11:00 AM",
      room: "Lab 203",
      status: "Active",
    },
  ]

  const filteredClasses = classes.filter((cls) => {
    const matchesSearch =
      cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.teacher.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesGrade = filterGrade === "all" || cls.grade === filterGrade
    const matchesSubject = filterSubject === "all" || cls.subject === filterSubject
    return matchesSearch && matchesGrade && matchesSubject
  })

  const getStatusBadge = (status: string, students: number, capacity: number) => {
    if (status === "Full" || students >= capacity) {
      return <Badge variant="destructive">Full</Badge>
    }
    return (
      <Badge variant="default" className="bg-emerald-100 text-emerald-800">
        Active
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Class Management</h1>
          <p className="text-gray-600 mt-1">Manage classes, schedules, and enrollments</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Class
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Class</DialogTitle>
              <DialogDescription>
                Add a new class to the system with teacher and schedule information.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="className">Class Name</Label>
                  <Input id="className" placeholder="e.g., Mathematics 101" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mathematics">Mathematics</SelectItem>
                      <SelectItem value="english">English</SelectItem>
                      <SelectItem value="science">Science</SelectItem>
                      <SelectItem value="history">History</SelectItem>
                      <SelectItem value="art">Art</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="grade">Grade Level</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="9th">9th Grade</SelectItem>
                      <SelectItem value="10th">10th Grade</SelectItem>
                      <SelectItem value="11th">11th Grade</SelectItem>
                      <SelectItem value="12th">12th Grade</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="teacher">Assign Teacher</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select teacher" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sarah">Dr. Sarah Johnson</SelectItem>
                      <SelectItem value="michael">Prof. Michael Brown</SelectItem>
                      <SelectItem value="emily">Dr. Emily Davis</SelectItem>
                      <SelectItem value="james">Mr. James Wilson</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="capacity">Class Capacity</Label>
                  <Input id="capacity" type="number" placeholder="30" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="room">Room</Label>
                  <Input id="room" placeholder="e.g., Room 205" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="schedule">Schedule</Label>
                <Input id="schedule" placeholder="e.g., Mon, Wed, Fri 9:00 AM" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" placeholder="Class description and objectives..." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setIsCreateDialogOpen(false)}>
                Create Class
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">+2 from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Classes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">22</div>
            <p className="text-xs text-muted-foreground">91.7% of total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enrollment</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">542</div>
            <p className="text-xs text-muted-foreground">Average 22.6 per class</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Capacity Usage</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87%</div>
            <p className="text-xs text-muted-foreground">542/625 total capacity</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Class Directory</CardTitle>
          <CardDescription>Search and filter classes by grade, subject, or teacher</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search classes or teachers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterGrade} onValueChange={setFilterGrade}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by grade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                <SelectItem value="9th Grade">9th Grade</SelectItem>
                <SelectItem value="10th Grade">10th Grade</SelectItem>
                <SelectItem value="11th Grade">11th Grade</SelectItem>
                <SelectItem value="12th Grade">12th Grade</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterSubject} onValueChange={setFilterSubject}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                <SelectItem value="Mathematics">Mathematics</SelectItem>
                <SelectItem value="English">English</SelectItem>
                <SelectItem value="Science">Science</SelectItem>
                <SelectItem value="History">History</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Classes Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class Name</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Enrollment</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClasses.map((cls) => (
                  <TableRow key={cls.id}>
                    <TableCell className="font-medium">{cls.name}</TableCell>
                    <TableCell>{cls.grade}</TableCell>
                    <TableCell>{cls.subject}</TableCell>
                    <TableCell>{cls.teacher}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>
                          {cls.students}/{cls.capacity}
                        </span>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-emerald-600 h-2 rounded-full"
                            style={{ width: `${(cls.students / cls.capacity) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-3 w-3" />
                        {cls.schedule}
                      </div>
                    </TableCell>
                    <TableCell>{cls.room}</TableCell>
                    <TableCell>{getStatusBadge(cls.status, cls.students, cls.capacity)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Class
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Users className="mr-2 h-4 w-4" />
                            Manage Students
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Calendar className="mr-2 h-4 w-4" />
                            View Schedule
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Class
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
