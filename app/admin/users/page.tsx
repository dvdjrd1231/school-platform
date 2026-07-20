"use client"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Users,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Mail,
  GraduationCap,
  UserCheck,
  Shield,
} from "lucide-react"

export default function UserManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRole, setSelectedRole] = useState("all")
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)

  const users = [
    {
      id: 1,
      name: "Sarah Johnson",
      email: "sarah.johnson@maatk12.edu",
      role: "student",
      grade: "10",
      status: "active",
      joinDate: "2024-01-15",
      lastLogin: "2024-01-20",
      phone: "+1 (555) 123-4567",
      classes: ["Math 101", "English 201", "Science 101"],
    },
    {
      id: 2,
      name: "Dr. Michael Smith",
      email: "m.smith@maatk12.edu",
      role: "teacher",
      department: "Mathematics",
      status: "active",
      joinDate: "2023-08-01",
      lastLogin: "2024-01-20",
      phone: "+1 (555) 234-5678",
      classes: ["Math 101", "Advanced Algebra", "Calculus"],
    },
    {
      id: 3,
      name: "Emily Davis",
      email: "emily.davis@maatk12.edu",
      role: "student",
      grade: "9",
      status: "active",
      joinDate: "2024-01-10",
      lastLogin: "2024-01-19",
      phone: "+1 (555) 345-6789",
      classes: ["English 101", "History 101", "Art 101"],
    },
    {
      id: 4,
      name: "Prof. Lisa Anderson",
      email: "l.anderson@maatk12.edu",
      role: "teacher",
      department: "English",
      status: "active",
      joinDate: "2023-09-01",
      lastLogin: "2024-01-20",
      phone: "+1 (555) 456-7890",
      classes: ["English 101", "Literature", "Creative Writing"],
    },
    {
      id: 5,
      name: "Admin User",
      email: "admin@maatk12.edu",
      role: "admin",
      department: "Administration",
      status: "active",
      joinDate: "2023-07-01",
      lastLogin: "2024-01-20",
      phone: "+1 (555) 567-8901",
      classes: [],
    },
  ]

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = selectedRole === "all" || user.role === selectedRole
    return matchesSearch && matchesRole
  })

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "student":
        return <GraduationCap className="h-4 w-4" />
      case "teacher":
        return <UserCheck className="h-4 w-4" />
      case "admin":
        return <Shield className="h-4 w-4" />
      default:
        return <Users className="h-4 w-4" />
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "student":
        return "bg-blue-100 text-blue-800"
      case "teacher":
        return "bg-green-100 text-green-800"
      case "admin":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "inactive":
        return "bg-red-100 text-red-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const userStats = {
    total: users.length,
    students: users.filter((u) => u.role === "student").length,
    teachers: users.filter((u) => u.role === "teacher").length,
    admins: users.filter((u) => u.role === "admin").length,
    active: users.filter((u) => u.status === "active").length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage students, teachers, and administrators</p>
        </div>
        <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>Create a new user account for the platform</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name</label>
                <Input placeholder="Enter full name" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email Address</label>
                <Input type="email" placeholder="Enter email address" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Role</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone Number</label>
                <Input placeholder="Enter phone number" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsAddUserOpen(false)}>Create User</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* User Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-emerald-600">{userStats.total}</p>
              </div>
              <Users className="h-6 w-6 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Students</p>
                <p className="text-2xl font-bold text-blue-600">{userStats.students}</p>
              </div>
              <GraduationCap className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Teachers</p>
                <p className="text-2xl font-bold text-green-600">{userStats.teachers}</p>
              </div>
              <UserCheck className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Admins</p>
                <p className="text-2xl font-bold text-purple-600">{userStats.admins}</p>
              </div>
              <Shield className="h-6 w-6 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">{userStats.active}</p>
              </div>
              <UserCheck className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedRole} onValueChange={setSelectedRole}>
          <SelectTrigger className="w-40">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="student">Students</SelectItem>
            <SelectItem value="teacher">Teachers</SelectItem>
            <SelectItem value="admin">Administrators</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
          <CardDescription>Manage all platform users</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Classes/Department</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                        {getRoleIcon(user.role)}
                      </div>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-gray-600">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getRoleBadgeColor(user.role)}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      {user.role === "student" && user.grade && ` - Grade ${user.grade}`}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusBadgeColor(user.status)}>
                      {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {user.role === "student" ? (
                        <span>
                          {user.classes?.slice(0, 2).join(", ")}
                          {user.classes && user.classes.length > 2 && "..."}
                        </span>
                      ) : (
                        <span>{user.department || "N/A"}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-600">{user.lastLogin}</div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit User
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Mail className="h-4 w-4 mr-2" />
                          Send Email
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
