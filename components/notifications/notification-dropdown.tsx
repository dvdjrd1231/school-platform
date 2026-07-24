"use client"

import { useCallback, useEffect, useState } from "react"
import { Bell, Check, ExternalLink } from "lucide-react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

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
import { apiGet, apiMutate } from "@/lib/api/client"
import { useRealtimeChannel } from "@/hooks/use-realtime"

interface Notification {
  _id: string
  title: string
  message: string
  type: "assignment" | "grade" | "announcement" | "discussion" | "message" | "system"
  priority: "high" | "medium" | "low"
  isRead: boolean
  createdAt: string
  actionUrl?: string
}

const ICON: Record<Notification["type"], string> = {
  assignment: "📝",
  grade: "📊",
  announcement: "📢",
  discussion: "💬",
  message: "✉️",
  system: "⚙️",
}

export function NotificationDropdown() {
  const router = useRouter()
  const { data: session } = useSession()
  const userId = session?.user?.id

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const load = useCallback(async () => {
    if (!userId) return
    try {
      const data = await apiGet<{ notifications: Notification[]; unreadCount: number }>(
        "/api/notifications?limit=20",
      )
      setNotifications(data.notifications)
      setUnreadCount(data.unreadCount)
    } catch {
      // Silent: a failed poll shouldn't disrupt the header.
    }
  }, [userId])

  useEffect(() => {
    void load()
  }, [load])

  // Live badge: the server publishes to the user's private channel on new
  // messages; re-fetch so the count updates without a page reload. No-op when
  // Pusher isn't configured.
  useRealtimeChannel(userId ? `private-user-${userId}` : null, "new-message", useCallback(() => void load(), [load]))

  const openNotification = async (n: Notification) => {
    if (!n.isRead) {
      setUnreadCount((c) => Math.max(0, c - 1))
      setNotifications((prev) => prev.map((x) => (x._id === n._id ? { ...x, isRead: true } : x)))
      await apiMutate(`/api/notifications/${n._id}`, "PATCH").catch(() => {})
    }
    if (n.actionUrl) router.push(n.actionUrl)
  }

  const markAllRead = async () => {
    setUnreadCount(0)
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    await apiMutate("/api/notifications", "PATCH").catch(() => {})
  }

  const priorityColor = (p: Notification["priority"]) =>
    p === "high" ? "text-red-600" : p === "medium" ? "text-yellow-600" : "text-gray-600"

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
            <Button variant="ghost" size="sm" onClick={markAllRead} className="h-6 px-2 text-xs">
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
            {notifications.map((n) => (
              <DropdownMenuItem
                key={n._id}
                className="flex flex-col items-start p-3 cursor-pointer hover:bg-gray-50"
                onClick={() => openNotification(n)}
              >
                <div className="flex items-start justify-between w-full">
                  <div className="flex items-start gap-2 flex-1">
                    <span className="text-lg">{ICON[n.type] ?? "🔔"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`font-medium text-sm ${!n.isRead ? "text-gray-900" : "text-gray-600"}`}>
                          {n.title}
                        </p>
                        {!n.isRead && <div className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{n.message}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-400">
                          {new Date(n.createdAt).toLocaleDateString()}
                        </span>
                        <span className={`text-xs ${priorityColor(n.priority)}`}>{n.priority}</span>
                      </div>
                    </div>
                  </div>
                  {n.actionUrl && <ExternalLink className="h-3 w-3 text-gray-400 flex-shrink-0 ml-2" />}
                </div>
              </DropdownMenuItem>
            ))}
          </ScrollArea>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
