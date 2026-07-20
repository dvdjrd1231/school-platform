import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Users,
  GraduationCap,
  BookOpen,
  BarChart3,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Plus,
  Settings,
  FileText,
} from "lucide-react"
import Link from "next/link"

export default function AdminDashboard() {
  const stats = {
    totalStudents: 1247,
    totalTeachers: 89,
    totalClasses: 156,
    totalLessons: 2341,
    activeAssignments: 234,
    pendingGrades: 67,
    systemAlerts: 3,
    completionRate: 87,
  }

  const recentActivity = [
    {
      type: "user",
      action: "New student enrolled",
      details: "Sarah Johnson - Grade 10",
      time: "2 hours ago",
      icon: Users,
    },
    {
      type: "class",
      action: "Class created",
      details: "Advanced Biology - Mr. Smith",
      time: "4 hours ago",
      icon: GraduationCap,
    },
    {
      type: "assignment",
      action: "Assignment submitted",
      details: "Math Quiz - 23 submissions",
      time: "6 hours ago",
      icon: FileText,
    },
    {
      type: "grade",
      action: "Grades published",
      details: "English Essay - Grade 9A",
      time: "1 day ago",
      icon: BarChart3,
    },
  ]

  const systemAlerts = [
    { type: "warning", message: "Server maintenance scheduled for tonight", priority: "medium" },
    { type: "info", message: "New feature: Video conferencing now available", priority: "low" },
    { type: "error", message: "Grade sync issue with 3 classes", priority: "high" },
  ]

  const quickActions = [
    { title: "Add New Student", href: "/admin/users?type=student", icon: Users, color: "bg-blue-500" },
    { title: "Create Class", href: "/admin/classes/new", icon: GraduationCap, color: "bg-green-500" },
    { title: "Add Lesson", href: "/admin/lessons/new", icon: BookOpen, color: "bg-purple-500" },
    { title: "Manage Grades", href: "/admin/grade-management", icon: BarChart3, color: "bg-orange-500" },
    { title: "System Settings", href: "/admin/settings", icon: Settings, color: "bg-gray-500" },
    { title: "View Reports", href: "/admin/reports", icon: TrendingUp, color: "bg-emerald-500" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Manage your Maat K12 platform</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-emerald-600 border-emerald-600">
            Administrator
          </Badge>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Quick Add
          </Button>
        </div>
      </div>

      {/* System Alerts */}
      {systemAlerts.length > 0 && (
        <div className="space-y-2">
          {systemAlerts.map((alert, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border-l-4 ${
                alert.priority === "high"
                  ? "bg-red-50 border-red-500"
                  : alert.priority === "medium"
                    ? "bg-yellow-50 border-yellow-500"
                    : "bg-blue-50 border-blue-500"
              }`}
            >
              <div className="flex items-center gap-2">
                <AlertCircle
                  className={`h-4 w-4 ${
                    alert.priority === "high"
                      ? "text-red-600"
                      : alert.priority === "medium"
                        ? "text-yellow-600"
                        : "text-blue-600"
                  }`}
                />
                <span className="font-medium">{alert.message}</span>
                <Badge variant="outline" size="sm">
                  {alert.priority}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-emerald-600">{stats.totalStudents}</p>
              </div>
              <Users className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Teachers</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalTeachers}</p>
              </div>
              <GraduationCap className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Classes</p>
                <p className="text-2xl font-bold text-purple-600">{stats.totalClasses}</p>
              </div>
              <BookOpen className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold text-green-600">{stats.completionRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          <TabsTrigger value="actions">Quick Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Platform Statistics</CardTitle>
                <CardDescription>Key metrics for your school platform</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Lessons</span>
                  <span className="font-bold">{stats.totalLessons}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Active Assignments</span>
                  <span className="font-bold">{stats.activeAssignments}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Pending Grades</span>
                  <span className="font-bold text-orange-600">{stats.pendingGrades}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">System Alerts</span>
                  <span className="font-bold text-red-600">{stats.systemAlerts}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
                <CardDescription>Current platform status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Database: Online</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">File Storage: Online</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm">Backup: Scheduled</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Email Service: Online</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest actions across the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => {
                  const Icon = activity.icon
                  return (
                    <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      <Icon className="h-5 w-5 text-emerald-600" />
                      <div className="flex-1">
                        <div className="font-medium">{activity.action}</div>
                        <div className="text-sm text-gray-600">{activity.details}</div>
                      </div>
                      <div className="text-sm text-gray-500">{activity.time}</div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon
              return (
                <Link key={index} href={action.href}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-lg ${action.color}`}>
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <div className="font-medium">{action.title}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
