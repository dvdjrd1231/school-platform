"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Bell, Check, Trash2, Search, Filter, ExternalLink, CheckCheck } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  getNotificationsByUser,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  type Notification,
} from "@/lib/database"

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const router = useRouter()

  useEffect(() => {
    // Load notifications for current user
    const userNotifications = getNotificationsByUser(1)
    setNotifications(userNotifications)
    setFilteredNotifications(userNotifications)
  }, [])

  useEffect(() => {
    // Filter notifications based on search and tab
    let filtered = notifications

    // Filter by tab
    if (activeTab === "unread") {
      filtered = filtered.filter((n) => !n.isRead)
    } else if (activeTab === "read") {
      filtered = filtered.filter((n) => n.isRead)
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (n) =>
          n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          n.message.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    setFilteredNotifications(filtered)
  }, [notifications, searchTerm, activeTab])

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markNotificationAsRead(notification.id)
      setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n)))
    }

    if (notification.actionUrl) {
      router.push(notification.actionUrl)
    }
  }

  const handleMarkAsRead = (id: number) => {
    markNotificationAsRead(id)
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
  }

  const handleMarkAllAsRead = () => {
    markAllNotificationsAsRead(1)
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
  }

  const handleDelete = (id: number) => {
    deleteNotification(id)
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "assignment":
        return "📝"
      case "grade":
        return "📊"
      case "announcement":
        return "📢"
      case "discussion":
        return "💬"
      case "system":
        return "⚙️"
      default:
        return "🔔"
    }
  }

  const getPriorityColor = (priority: Notification["priority"]) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600">Manage your notifications and stay updated</p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button onClick={handleMarkAllAsRead} variant="outline">
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark all as read ({unreadCount})
            </Button>
          )}
        </div>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All ({notifications.length})</TabsTrigger>
          <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
          <TabsTrigger value="read">Read ({notifications.length - unreadCount})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
                <p className="text-gray-600">
                  {activeTab === "unread"
                    ? "You're all caught up! No unread notifications."
                    : "No notifications found matching your criteria."}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredNotifications.map((notification) => (
              <Card
                key={notification.id}
                className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                  !notification.isRead ? "border-l-4 border-l-emerald-500" : ""
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div
                      className="flex items-start gap-3 flex-1"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`font-medium ${!notification.isRead ? "text-gray-900" : "text-gray-700"}`}>
                            {notification.title}
                          </h3>
                          {!notification.isRead && <div className="w-2 h-2 bg-emerald-500 rounded-full" />}
                          <Badge className={getPriorityColor(notification.priority)}>{notification.priority}</Badge>
                        </div>
                        <p className="text-gray-600 mb-2">{notification.message}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>{new Date(notification.createdAt).toLocaleString()}</span>
                          {notification.actionUrl && (
                            <span className="flex items-center gap-1">
                              <ExternalLink className="h-3 w-3" />
                              Click to view
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {!notification.isRead && (
                        <Button variant="ghost" size="sm" onClick={() => handleMarkAsRead(notification.id)}>
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(notification.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
