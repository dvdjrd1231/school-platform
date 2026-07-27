"use client"

import { useState } from "react"
import { Bell, Loader2, Send } from "lucide-react"

import { useApi } from "@/hooks/use-api"
import { apiMutate } from "@/lib/api/client"
import { useCourses } from "@/components/context/course-context"
import { AsyncState } from "@/components/ui/async-state"
import { useConfirm } from "@/components/ui/confirm-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

type Audience = "all" | "student" | "teacher" | "parent" | "admin" | "course"

interface NotificationItem {
  _id: string
  title: string
  message: string
  type: string
  priority: string
  isRead: boolean
  createdAt: string
}

const AUDIENCE_LABEL: Record<Audience, string> = {
  all: "Everyone",
  student: "All students",
  teacher: "All teachers",
  parent: "All parents",
  admin: "All admins",
  course: "One class",
}

/**
 * Admin notifications: send one, and see your own feed.
 *
 * This is the deliberate broadcast channel. Announcements are the place for
 * something people should be able to read back and reply to; this is for a
 * short, one-way "the system will be down on Friday".
 */
export default function AdminNotificationsPage() {
  const { courses } = useCourses()
  const feed = useApi<{ notifications: NotificationItem[]; unreadCount: number }>(
    "/api/notifications?limit=30",
  )

  const [form, setForm] = useState({
    title: "",
    message: "",
    audience: "all" as Audience,
    courseId: "",
    priority: "medium" as "high" | "medium" | "low",
    actionUrl: "",
  })
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState("")
  const [error, setError] = useState("")
  const [confirm, confirmDialog] = useConfirm()

  const send = async () => {
    setError("")
    setResult("")

    if (form.title.trim().length < 2) return setError("Give the notification a title")
    if (!form.message.trim()) return setError("Write the message")
    if (form.audience === "course" && !form.courseId) return setError("Choose a class")

    const ok = await confirm({
      title: `Send to ${AUDIENCE_LABEL[form.audience].toLowerCase()}?`,
      description:
        "Everyone it reaches gets it immediately, and it can't be recalled. For anything people should be able to read back or reply to, post an announcement instead.",
      confirmLabel: "Send",
      destructive: false,
    })
    if (!ok) return

    setSending(true)
    try {
      const response = await apiMutate<{ sent: number }>("/api/notifications", "POST", {
        title: form.title.trim(),
        message: form.message.trim(),
        audience: form.audience,
        courseId: form.audience === "course" ? form.courseId : undefined,
        priority: form.priority,
        actionUrl: form.actionUrl.trim() || undefined,
      })
      setResult(`Sent to ${response.sent} ${response.sent === 1 ? "person" : "people"}.`)
      setForm((f) => ({ ...f, title: "", message: "", actionUrl: "" }))
      await feed.refetch()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the notification")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
        <p className="text-gray-600">Send a short message straight to people&apos;s bells.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Send className="h-5 w-5" />
              Send a notification
            </CardTitle>
            <CardDescription>
              For anything that needs a reply or a record, post an announcement instead.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Systems maintenance on Friday"
              />
            </div>

            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                rows={4}
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Send to</Label>
                <Select
                  value={form.audience}
                  onValueChange={(v) => setForm((f) => ({ ...f, audience: v as Audience }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(AUDIENCE_LABEL) as Audience[]).map((key) => (
                      <SelectItem key={key} value={key}>
                        {AUDIENCE_LABEL[key]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, priority: v as "high" | "medium" | "low" }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {form.audience === "course" && (
              <div className="space-y-2">
                <Label>Class</Label>
                <Select
                  value={form.courseId || undefined}
                  onValueChange={(v) => setForm((f) => ({ ...f, courseId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a class" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((c) => (
                      <SelectItem key={c._id} value={c._id}>
                        {c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Link (optional)</Label>
              <Input
                value={form.actionUrl}
                onChange={(e) => setForm((f) => ({ ...f, actionUrl: e.target.value }))}
                placeholder="/announcements"
              />
              <p className="text-xs text-muted-foreground">
                Where clicking the notification takes them.
              </p>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            {result && <p className="text-sm text-green-700">{result}</p>}

            <Button onClick={() => void send()} disabled={sending}>
              {sending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Send
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-5 w-5" />
              Your notifications
            </CardTitle>
            <CardDescription>
              What&apos;s landed on your own account, newest first.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AsyncState
              isLoading={feed.isLoading}
              error={feed.error}
              isEmpty={(feed.data?.notifications ?? []).length === 0}
              emptyMessage="Nothing yet."
              onRetry={feed.refetch}
            >
              <div className="space-y-3">
                {(feed.data?.notifications ?? []).map((item) => (
                  <div
                    key={item._id}
                    className={`rounded-md border p-3 ${item.isRead ? "" : "bg-emerald-50"}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium">{item.title}</p>
                      <div className="flex shrink-0 gap-1">
                        {!item.isRead && <Badge>New</Badge>}
                        <Badge variant="outline">{item.type}</Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.message}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                ))}
              </div>
            </AsyncState>
          </CardContent>
        </Card>
      </div>

      {confirmDialog}
    </div>
  )
}
