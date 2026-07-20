"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Bell, Send } from "lucide-react"
import { useRole } from "@/components/context/role-context"
import { createNotification, type Notification } from "@/lib/database"

export default function AdminNotificationsPage() {
  const { isAdmin, isTeacher } = useRole()
  const [notification, setNotification] = useState({
    title: "",
    message: "",
    type: "announcement" as Notification["type"],
    priority: "medium" as Notification["priority"],
    recipient: "all", // all, students, teachers, parents, specific-class
    classId: "",
    actionUrl: "",
  })

  const [sentNotifications, setSentNotifications] = useState<Array<Notification & { recipient: string }>>([])

  const handleSendNotification = () => {
    if (!isAdmin && !isTeacher) return

    // Create notification for different recipient groups
    const baseNotification = {
      title: notification.title,
      message: notification.message,
      type: notification.type,
      priority: notification.priority,
      isRead: false,
      createdAt: new Date().toISOString(),
      actionUrl: notification.actionUrl || undefined,
      classId: notification.classId ? Number.parseInt(notification.classId) : undefined,
    }

    // Send to appropriate users based on recipient selection
    let recipientCount = 0
    if (notification.recipient === "all") {
      // Send to all users (students, teachers, parents)
      for (let userId = 1; userId <= 50; userId++) {
        createNotification({ ...baseNotification, userId })
        recipientCount++
      }
    } else if (notification.recipient === "students") {
      // Send to students only
      for (let userId = 1; userId <= 30; userId++) {
        createNotification({ ...baseNotification, userId })
        recipientCount++
      }
    } else if (notification.recipient === "teachers") {
      // Send to teachers only
      for (let userId = 31; userId <= 40; userId++) {
        createNotification({ ...baseNotification, userId })
        recipientCount++
      }
    } else if (notification.recipient === "parents") {
      // Send to parents only
      for (let userId = 41; userId <= 50; userId++) {
        createNotification({ ...baseNotification, userId })
        recipientCount++
      }
    }

    // Add to sent notifications list
    setSentNotifications([
      { ...baseNotification, id: Date.now(), recipient: notification.recipient },
      ...sentNotifications,
    ])

    // Reset form
    setNotification({
      title: "",
      message: "",
      type: "announcement",
      priority: "medium",
      recipient: "all",
      classId: "",
      actionUrl: "",
    })

    alert(`Notification sent to ${recipientCount} recipients!`)
  }

  if (!isAdmin && !isTeacher) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-2">Access Denied</h2>
            <p className="text-gray-600">Only administrators and teachers can send notifications.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Send Notifications</h1>
        <p className="text-gray-600 mt-2">Send notifications to students, teachers, and parents</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Send Notification Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Create Notification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={notification.title}
                onChange={(e) => setNotification({ ...notification, title: e.target.value })}
                placeholder="Enter notification title"
              />
            </div>

            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={notification.message}
                onChange={(e) => setNotification({ ...notification, message: e.target.value })}
                placeholder="Enter notification message"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Type</Label>
                <Select
                  value={notification.type}
                  onValueChange={(value: Notification["type"]) => setNotification({ ...notification, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="announcement">Announcement</SelectItem>
                    <SelectItem value="assignment">Assignment</SelectItem>
                    <SelectItem value="grade">Grade</SelectItem>
                    <SelectItem value="discussion">Discussion</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={notification.priority}
                  onValueChange={(value: Notification["priority"]) =>
                    setNotification({ ...notification, priority: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="recipient">Send To</Label>
              <Select
                value={notification.recipient}
                onValueChange={(value) => setNotification({ ...notification, recipient: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="students">Students Only</SelectItem>
                  <SelectItem value="teachers">Teachers Only</SelectItem>
                  <SelectItem value="parents">Parents Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="actionUrl">Action URL (Optional)</Label>
              <Input
                id="actionUrl"
                value={notification.actionUrl}
                onChange={(e) => setNotification({ ...notification, actionUrl: e.target.value })}
                placeholder="e.g., /assignments/123"
              />
            </div>

            <Button
              onClick={handleSendNotification}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              disabled={!notification.title || !notification.message}
            >
              <Send className="h-4 w-4 mr-2" />
              Send Notification
            </Button>
          </CardContent>
        </Card>

        {/* Sent Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Recently Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sentNotifications.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No notifications sent yet</p>
              ) : (
                sentNotifications.map((notif) => (
                  <div key={notif.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium">{notif.title}</h4>
                      <Badge
                        className={
                          notif.priority === "high"
                            ? "bg-red-100 text-red-800"
                            : notif.priority === "medium"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                        }
                      >
                        {notif.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{notif.message}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>To: {notif.recipient}</span>
                      <span>{new Date(notif.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
