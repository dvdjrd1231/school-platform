"use client"

import { useCallback, useEffect, useState } from "react"
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
import { StatTile } from "@/components/admin/stat-tile"
import {
  Users,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Mail,
  GraduationCap,
  UserCheck,
  Shield,
  Trash2,
  Loader2,
} from "lucide-react"

type Role = "student" | "teacher" | "admin" | "parent"

interface ApiUser {
  _id: string
  name: string
  email: string
  roles: Role[]
  status: "active" | "inactive"
  gradeLevel?: string
  subject?: string
  department?: string
  studentId?: string
  createdAt?: string
}

const CREATABLE_ROLES: { value: Role; label: string }[] = [
  { value: "student", label: "Student" },
  { value: "teacher", label: "Teacher" },
  { value: "admin", label: "Administrator" },
  { value: "parent", label: "Parent" },
]

/** The most privileged role, used for the badge and icon. */
function primaryRole(roles: Role[]): Role {
  return roles.includes("admin")
    ? "admin"
    : roles.includes("teacher")
      ? "teacher"
      : roles.includes("parent")
        ? "parent"
        : "student"
}

const EMPTY_FORM = { name: "", email: "", role: "student" as Role, password: "", gradeLevel: "", subject: "", department: "" }

export default function UserManagement() {
  const [users, setUsers] = useState<ApiUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState("")

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRole, setSelectedRole] = useState("all")

  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadUsers = useCallback(async () => {
    setIsLoading(true)
    setLoadError("")
    try {
      const res = await fetch("/api/users?limit=100", { cache: "no-store" })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? `Failed to load users (${res.status})`)
      }
      const data = await res.json()
      setUsers(data.users ?? [])
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load users")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadUsers()
  }, [loadUsers])

  const handleCreate = async () => {
    setFormError("")

    if (form.name.trim().length < 2) return setFormError("Name must be at least 2 characters")
    if (!form.email.includes("@")) return setFormError("Enter a valid email address")
    if (form.password.length < 8) return setFormError("Password must be at least 8 characters")

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          roles: [form.role],
          gradeLevel: form.role === "student" ? form.gradeLevel || undefined : undefined,
          subject: form.role === "teacher" ? form.subject || undefined : undefined,
          department: form.role === "admin" ? form.department || undefined : undefined,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? `Failed to create user (${res.status})`)

      setIsAddUserOpen(false)
      setForm(EMPTY_FORM)
      await loadUsers()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create user")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeactivate = async (id: string) => {
    // Optimistic: reflect the change immediately, reload to confirm.
    setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, status: "inactive" } : u)))
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" })
      if (!res.ok) await loadUsers() // revert to server truth on failure
    } catch {
      await loadUsers()
    }
  }

  const filteredUsers = users.filter((user) => {
    const term = searchTerm.toLowerCase()
    const matchesSearch =
      user.name.toLowerCase().includes(term) || user.email.toLowerCase().includes(term)
    const matchesRole = selectedRole === "all" || user.roles.includes(selectedRole as Role)
    return matchesSearch && matchesRole
  })

  const getRoleIcon = (role: Role) => {
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

  const getRoleBadgeColor = (role: Role) => {
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

  const userStats = {
    total: users.length,
    students: users.filter((u) => u.roles.includes("student")).length,
    teachers: users.filter((u) => u.roles.includes("teacher")).length,
    admins: users.filter((u) => u.roles.includes("admin")).length,
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
              <DialogDescription>Create a new account. This is how teacher and admin accounts are created.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name</label>
                <Input
                  placeholder="Enter full name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email Address</label>
                <Input
                  type="email"
                  placeholder="Enter email address"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Role</label>
                <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v as Role }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {CREATABLE_ROLES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {form.role === "student" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Grade Level (optional)</label>
                  <Input
                    placeholder="e.g. 10th"
                    value={form.gradeLevel}
                    onChange={(e) => setForm((f) => ({ ...f, gradeLevel: e.target.value }))}
                  />
                </div>
              )}
              {form.role === "teacher" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Subject (optional)</label>
                  <Input
                    placeholder="e.g. Mathematics"
                    value={form.subject}
                    onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                  />
                </div>
              )}
              {form.role === "admin" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Department (optional)</label>
                  <Input
                    placeholder="e.g. IT"
                    value={form.department}
                    onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Temporary Password</label>
                <Input
                  type="password"
                  placeholder="At least 8 characters"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                />
              </div>

              {formError && (
                <p className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-600" role="alert">
                  {formError}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddUserOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating…
                  </>
                ) : (
                  "Create User"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* User Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatTile label="Total Users" value={userStats.total} icon={Users} color="text-emerald-600" bg="bg-emerald-50" />
        <StatTile label="Students" value={userStats.students} icon={GraduationCap} color="text-blue-600" bg="bg-blue-50" />
        <StatTile label="Teachers" value={userStats.teachers} icon={UserCheck} color="text-green-600" bg="bg-green-50" />
        <StatTile label="Admins" value={userStats.admins} icon={Shield} color="text-purple-600" bg="bg-purple-50" />
        <StatTile label="Active" value={userStats.active} icon={UserCheck} color="text-green-600" bg="bg-green-50" />
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
            <SelectItem value="parent">Parents</SelectItem>
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
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading users…
            </div>
          ) : loadError ? (
            <div className="py-12 text-center">
              <p className="text-red-600 mb-3">{loadError}</p>
              <Button variant="outline" onClick={() => void loadUsers()}>
                Try again
              </Button>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              No users found. Click “Add User” to create one.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => {
                  const role = primaryRole(user.roles)
                  return (
                    <TableRow key={user._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                            {getRoleIcon(role)}
                          </div>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-gray-600">{user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRoleBadgeColor(role)}>
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                          {role === "student" && user.gradeLevel && ` - ${user.gradeLevel}`}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={user.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                          {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">
                          {role === "student"
                            ? user.studentId ?? "—"
                            : user.subject ?? user.department ?? "—"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <a href={`mailto:${user.email}`}>
                                <Mail className="h-4 w-4 mr-2" />
                                Send Email
                              </a>
                            </DropdownMenuItem>
                            {user.status === "active" && (
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => void handleDeactivate(user._id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Deactivate User
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
