"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Bell, CheckCheck, Clock, ExternalLink, Loader2 } from "lucide-react"

import { useApi } from "@/hooks/use-api"
import { apiMutate } from "@/lib/api/client"
import { AsyncState } from "@/components/ui/async-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface NotificationItem {
  _id: string
  title: string
  message: string
  type: "assignment" | "grade" | "announcement" | "discussion" | "message" | "system"
  priority: "high" | "medium" | "low"
  isRead: boolean
  actionUrl?: string
  createdAt: string
}

const TYPE_LABEL: Record<NotificationItem["type"], string> = {
  assignment: "Assignment",
  grade: "Grade",
  announcement: "Announcement",
  discussion: "Discussion",
  message: "Message",
  system: "System",
}

interface Props {
  title?: string
  description?: string
}

/**
 * The full notification history behind the bell.
 *
 * Shared by /updates and the campus notifications page — the same feed appears
 * in both places in the template, and two copies would drift apart.
 */
export function UpdatesFeed({ title = "Updates", description }: Props) {
  const router = useRouter()
  const { data, error, isLoading, refetch } = useApi<{
    notifications: NotificationItem[]
    unreadCount: number
  }>("/api/notifications?limit=50")

  const [marking, setMarking] = useState(false)
  const updates = data?.notifications ?? []

  const open = async (update: NotificationItem) => {
    if (!update.isRead) {
      // Fire and forget: navigation shouldn't wait on bookkeeping.
      void apiMutate(`/api/notifications/${update._id}`, "PATCH").catch(() => {})
    }
    if (update.actionUrl) router.push(update.actionUrl)
    else await refetch()
  }

  const markAllRead = async () => {
    setMarking(true)
    try {
      await apiMutate("/api/notifications", "PATCH")
      await refetch()
    } finally {
      setMarking(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-emerald-600">{title}</h1>
          <p className="text-muted-foreground">
            {description ?? "Everything that's happened on your account"}
            {data?.unreadCount ? ` — ${data.unreadCount} unread` : ""}
          </p>
        </div>
        {(data?.unreadCount ?? 0) > 0 && (
          <Button variant="outline" onClick={() => void markAllRead()} disabled={marking}>
            {marking ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCheck className="mr-2 h-4 w-4" />
            )}
            Mark all read
          </Button>
        )}
      </div>

      <AsyncState
        isLoading={isLoading}
        error={error}
        isEmpty={updates.length === 0}
        emptyMessage="Nothing yet. New assignments, grades and messages show up here."
        onRetry={refetch}
      >
        <div className="space-y-4">
          {updates.map((update) => (
            <Card
              key={update._id}
              className={`cursor-pointer transition-shadow hover:shadow-lg ${
                update.isRead ? "" : "border-emerald-200 bg-emerald-50"
              }`}
              onClick={() => void open(update)}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Bell
                      className={`mt-1 h-5 w-5 ${
                        update.isRead ? "text-muted-foreground" : "text-emerald-600"
                      }`}
                    />
                    <div>
                      <CardTitle className="text-lg">{update.title}</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>
                          {new Date(update.createdAt).toLocaleString(undefined, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {!update.isRead && <Badge>New</Badge>}
                    {update.priority === "high" && <Badge variant="destructive">Important</Badge>}
                    <Badge variant="outline">{TYPE_LABEL[update.type]}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-muted-foreground">{update.message}</p>
                {update.actionUrl && (
                  <Button variant="outline" size="sm">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View details
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </AsyncState>
    </div>
  )
}
