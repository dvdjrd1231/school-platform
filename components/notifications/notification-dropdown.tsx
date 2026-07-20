"use client"

import { useState, useEffect } from "react"
import { Bell, Check, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useRouter } from "next/navigation"
import {
  getNotificationsByUser,
  getUnreadNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type Notification,
} from "@/lib/database"

interface NotificationDropdownProps {
  userId?: number
}

export function NotificationDropdown({ userId = 1 }: NotificationDropdownProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const router = useRouter()

  useEffect(() => {
    // Load notifications
    const userNotifications = getNotificationsByUser(userId)
    const unread = getUnreadNotifications(userId)
    setNotifications(userNotifications.slice(0, 10)) // Show latest 10
    setUnreadCount(unread.length)
  }, [userId])

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    markNotificationAsRead(notification.id)
    setUnreadCount((prev) => Math.max(0, prev - 1))

    // Navigate to related page
    if (notification.actionUrl) {
      router.push(notification.actionUrl)
    }
  }

  const handleMarkAllAsRead = () => {
    markAllNotificationsAsRead(userId)
    setUnreadCount(0)
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
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
        return "text-red-600"
      case "medium":
        return "text-yellow-600"
      case "low":
        return "text-gray-600"
      default:
        return "text-gray-600"
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end" forceMount>
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead} className="h-6 px-2 text-xs">
              <Check className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">No notifications yet</div>
        ) : (
          <ScrollArea className="h-80">
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="flex flex-col items-start p-3 cursor-pointer hover:bg-gray-50"
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start justify-between w-full">
                  <div className="flex items-start gap-2 flex-1">
                    <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p
                          className={`font-medium text-sm ${!notification.isRead ? "text-gray-900" : "text-gray-600"}`}
                        >
                          {notification.title}
                        </p>
                        {!notification.isRead && <div className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{notification.message}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-400">
                          {new Date(notification.createdAt).toLocaleDateString()}
                        </span>
                        <span className={`text-xs ${getPriorityColor(notification.priority)}`}>
                          {notification.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                  {notification.actionUrl && <ExternalLink className="h-3 w-3 text-gray-400 flex-shrink-0 ml-2" />}
                </div>
              </DropdownMenuItem>
            ))}
          </ScrollArea>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-center justify-center text-emerald-600 hover:text-emerald-700"
          onClick={() => router.push("/campus/account/notifications")}
        >
          View all notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
