"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  BookOpen,
  Award,
  Clock,
  Edit,
  Camera,
  Bell,
  Shield,
  Key,
} from "lucide-react"

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false)

  const studentInfo = {
    name: "Emma Johnson",
    email: "emma.johnson@maatk12.edu",
    studentId: "STU001",
    grade: "10th Grade",
    phone: "(555) 123-4567",
    address: "123 Main St, Anytown, ST 12345",
    enrollmentDate: "August 2023",
    gpa: "3.7",
    credits: "24",
  }

  const achievements = [
    { title: "Honor Roll", date: "Fall 2023", type: "Academic" },
    { title: "Perfect Attendance", date: "Fall 2023", type: "Attendance" },
    { title: "Math Competition Winner", date: "October 2023", type: "Competition" },
    { title: "Student Council Member", date: "2023-2024", type: "Leadership" },
  ]

  const recentActivity = [
    { action: "Submitted assignment", subject: "Mathematics 101", time: "2 hours ago" },
    { action: "Completed quiz", subject: "English Literature", time: "1 day ago" },
    { action: "Joined discussion", subject: "Biology Fundamentals", time: "2 days ago" },
    { action: "Downloaded materials", subject: "World History", time: "3 days ago" },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <Button
          variant={isEditing ? "default" : "outline"}
          onClick={() => setIsEditing(!isEditing)}
          className={isEditing ? "bg-emerald-600 hover:bg-emerald-700" : ""}
        >
          <Edit className="h-4 w-4 mr-2" />
          {isEditing ? "Save Changes" : "Edit Profile"}
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="academic">Academic</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Card */}
            <Card className="lg:col-span-1">
              <CardHeader className="text-center">
                <div className="relative mx-auto">
                  <Avatar className="h-24 w-24 mx-auto">
                    <AvatarImage src="/placeholder.svg?height=96&width=96" />
                    <AvatarFallback className="text-2xl">EJ</AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <Button size="sm" className="absolute -bottom-2 -right-2 rounded-full h-8 w-8 p-0">
                      <Camera className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <CardTitle className="mt-4">{studentInfo.name}</CardTitle>
                <CardDescription>
                  {studentInfo.grade} • {studentInfo.studentId}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{studentInfo.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{studentInfo.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{studentInfo.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">Enrolled {studentInfo.enrollmentDate}</span>
                </div>
              </CardContent>
            </Card>

            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Academic Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Academic Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-emerald-600">{studentInfo.gpa}</div>
                      <div className="text-sm text-gray-600">Current GPA</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{studentInfo.credits}</div>
                      <div className="text-sm text-gray-600">Credits Earned</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">5</div>
                      <div className="text-sm text-gray-600">Current Classes</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium text-sm">{activity.action}</div>
                          <div className="text-sm text-gray-600">{activity.subject}</div>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          {activity.time}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="academic">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {achievements.map((achievement, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{achievement.title}</div>
                        <div className="text-sm text-gray-600">{achievement.date}</div>
                      </div>
                      <Badge variant="outline">{achievement.type}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Current Classes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Current Classes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Mathematics 101</div>
                      <div className="text-sm text-gray-600">Dr. Sarah Johnson</div>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-800">A-</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">English Literature</div>
                      <div className="text-sm text-gray-600">Prof. Michael Brown</div>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-800">A-</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Biology Fundamentals</div>
                      <div className="text-sm text-gray-600">Dr. Emily Davis</div>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">B+</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" defaultValue="Emma" disabled={!isEditing} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" defaultValue="Johnson" disabled={!isEditing} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" defaultValue={studentInfo.email} disabled={!isEditing} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" defaultValue={studentInfo.phone} disabled={!isEditing} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea id="bio" placeholder="Tell us about yourself..." disabled={!isEditing} />
                </div>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Assignment Reminders</div>
                    <div className="text-sm text-gray-600">Get notified about upcoming assignments</div>
                  </div>
                  <input type="checkbox" defaultChecked className="rounded" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Grade Updates</div>
                    <div className="text-sm text-gray-600">Receive notifications when grades are posted</div>
                  </div>
                  <input type="checkbox" defaultChecked className="rounded" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Discussion Replies</div>
                    <div className="text-sm text-gray-600">Get notified about replies to your posts</div>
                  </div>
                  <input type="checkbox" className="rounded" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Announcements</div>
                    <div className="text-sm text-gray-600">Receive important school announcements</div>
                  </div>
                  <input type="checkbox" defaultChecked className="rounded" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="privacy">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Security Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input id="currentPassword" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input id="newPassword" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input id="confirmPassword" type="password" />
                </div>
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                  <Key className="h-4 w-4 mr-2" />
                  Update Password
                </Button>
              </CardContent>
            </Card>

            {/* Privacy Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Privacy Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Profile Visibility</div>
                    <div className="text-sm text-gray-600">Who can see your profile information</div>
                  </div>
                  <select className="border rounded px-2 py-1">
                    <option>Teachers Only</option>
                    <option>Classmates</option>
                    <option>Everyone</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Activity Status</div>
                    <div className="text-sm text-gray-600">Show when you're online</div>
                  </div>
                  <input type="checkbox" defaultChecked className="rounded" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Grade Sharing</div>
                    <div className="text-sm text-gray-600">Allow parents to view grades</div>
                  </div>
                  <input type="checkbox" defaultChecked className="rounded" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
