"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { CalendarDays, ChevronLeft, ChevronRight, Clock, Loader2, MapPin, Pencil, Plus, Trash2 } from "lucide-react"

import { useApi } from "@/hooks/use-api"
import { apiMutate } from "@/lib/api/client"
import { useCourses } from "@/components/context/course-context"
import { useRole } from "@/components/context/role-context"
import { AsyncState } from "@/components/ui/async-state"
import { useConfirm } from "@/components/ui/confirm-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

type EventType = "class" | "assignment" | "exam" | "meeting" | "holiday" | "event"

interface CalendarItem {
  _id: string
  title: string
  description?: string
  type: EventType
  start: string
  end?: string
  allDay?: boolean
  location?: string
  course?: { _id: string; title: string } | null
  createdBy?: { _id: string; name?: string } | null
  source: "event" | "assignment"
  points?: number
}

interface EventsResponse {
  events: CalendarItem[]
  deadlines: CalendarItem[]
}

const TYPE_STYLES: Record<EventType, string> = {
  class: "bg-blue-100 text-blue-800",
  assignment: "bg-amber-100 text-amber-800",
  exam: "bg-red-100 text-red-800",
  meeting: "bg-purple-100 text-purple-800",
  holiday: "bg-green-100 text-green-800",
  event: "bg-emerald-100 text-emerald-800",
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

/** Local-date key (YYYY-MM-DD) — grouping by UTC would shift evening events a day. */
function dayKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

/** Value for a `datetime-local` input, which wants local time with no zone. */
function toLocalInput(date: Date): string {
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

interface Props {
  /** Restrict to one course — the classroom calendar. */
  courseId?: string
  title?: string
  description?: string
}

/**
 * The month calendar, shared by the school, classroom and admin calendars.
 *
 * It shows two kinds of entry: events someone created (editable) and assignment
 * due dates (read-only, pulled from the assignments themselves so they can never
 * drift out of sync with the real deadline).
 */
export function SchoolCalendar({ courseId, title, description }: Props) {
  const router = useRouter()
  const { isTeacher, isAdmin, userId } = useRole()
  const { courses } = useCourses()
  const canManage = isTeacher || isAdmin

  const [cursor, setCursor] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  // Fetch the whole visible grid, which spills into the neighbouring months.
  const gridStart = useMemo(() => {
    const first = new Date(cursor)
    first.setDate(1 - first.getDay())
    return first
  }, [cursor])
  const gridEnd = useMemo(() => {
    const end = new Date(gridStart)
    end.setDate(end.getDate() + 42)
    return end
  }, [gridStart])

  const query = new URLSearchParams({
    from: gridStart.toISOString(),
    to: gridEnd.toISOString(),
    ...(courseId ? { courseId } : {}),
  })
  const { data, error, isLoading, refetch } = useApi<EventsResponse>(`/api/events?${query}`)

  const items = useMemo(
    () => [...(data?.events ?? []), ...(data?.deadlines ?? [])],
    [data],
  )

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarItem[]>()
    for (const item of items) {
      const key = dayKey(new Date(item.start))
      const list = map.get(key) ?? []
      list.push(item)
      map.set(key, list)
    }
    for (const list of map.values()) {
      list.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    }
    return map
  }, [items])

  const days = useMemo(() => {
    const out: Date[] = []
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart)
      d.setDate(gridStart.getDate() + i)
      out.push(d)
    }
    return out
  }, [gridStart])

  const upcoming = useMemo(
    () =>
      items
        .filter((i) => new Date(i.start).getTime() >= Date.now())
        .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
        .slice(0, 8),
    [items],
  )

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "event" as EventType,
    start: "",
    end: "",
    allDay: false,
    location: "",
    course: courseId ?? "",
  })
  const [formError, setFormError] = useState("")
  const [saving, setSaving] = useState(false)
  const [confirm, confirmDialog] = useConfirm()

  const openCreate = (day?: Date) => {
    const start = day ? new Date(day) : new Date()
    if (day) start.setHours(9, 0, 0, 0)
    setEditingId(null)
    setForm({
      title: "",
      description: "",
      type: "event",
      start: toLocalInput(start),
      end: "",
      allDay: false,
      location: "",
      course: courseId ?? "",
    })
    setFormError("")
    setDialogOpen(true)
  }

  const openEdit = (item: CalendarItem) => {
    setEditingId(item._id)
    setForm({
      title: item.title,
      description: item.description ?? "",
      type: item.type,
      start: toLocalInput(new Date(item.start)),
      end: item.end ? toLocalInput(new Date(item.end)) : "",
      allDay: item.allDay ?? false,
      location: item.location ?? "",
      course: item.course?._id ?? "",
    })
    setFormError("")
    setDialogOpen(true)
  }

  const save = async () => {
    setFormError("")
    if (form.title.trim().length < 2) return setFormError("Give the event a name")
    if (!form.start) return setFormError("Pick a start date and time")

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      type: form.type,
      start: new Date(form.start).toISOString(),
      end: form.end ? new Date(form.end).toISOString() : undefined,
      allDay: form.allDay,
      location: form.location.trim() || undefined,
    }

    setSaving(true)
    try {
      if (editingId) {
        await apiMutate(`/api/events/${editingId}`, "PATCH", payload)
      } else {
        await apiMutate("/api/events", "POST", {
          ...payload,
          course: form.course || undefined,
        })
      }
      setDialogOpen(false)
      setEditingId(null)
      await refetch()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not save the event")
    } finally {
      setSaving(false)
    }
  }

  const remove = async (item: CalendarItem) => {
    const ok = await confirm({
      title: "Delete this event?",
      description: `"${item.title}" will be removed from the calendar. This cannot be undone.`,
    })
    if (!ok) return
    await apiMutate(`/api/events/${item._id}`, "DELETE")
    await refetch()
  }

  const canEditItem = (item: CalendarItem) =>
    item.source === "event" && (isAdmin || item.createdBy?._id === userId)

  const today = dayKey(new Date())
  const monthLabel = cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })

  const shift = (months: number) =>
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + months, 1))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-emerald-600">{title ?? "Calendar"}</h1>
          <p className="text-muted-foreground">
            {description ?? "Classes, deadlines and school events in one place"}
          </p>
        </div>
        {canManage && (
          <Button onClick={() => openCreate()}>
            <Plus className="mr-2 h-4 w-4" />
            Add event
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              {monthLabel}
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" onClick={() => shift(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const now = new Date()
                  setCursor(new Date(now.getFullYear(), now.getMonth(), 1))
                }}
              >
                Today
              </Button>
              <Button variant="outline" size="icon" onClick={() => shift(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <AsyncState isLoading={isLoading} error={error} onRetry={refetch}>
              <div className="grid grid-cols-7 gap-px border-b text-center text-xs font-medium text-muted-foreground">
                {DAY_NAMES.map((d) => (
                  <div key={d} className="pb-2">
                    {d}
                  </div>
                ))}
              </div>
              <div className="mt-px grid grid-cols-7 gap-px bg-border">
                {days.map((day) => {
                  const key = dayKey(day)
                  const dayItems = byDay.get(key) ?? []
                  const inMonth = day.getMonth() === cursor.getMonth()

                  return (
                    <div
                      key={key}
                      className={`min-h-24 bg-background p-1 ${inMonth ? "" : "opacity-40"} ${
                        canManage ? "cursor-pointer hover:bg-muted/50" : ""
                      }`}
                      onClick={() => canManage && openCreate(day)}
                    >
                      <div
                        className={`mb-1 text-right text-xs ${
                          key === today ? "font-bold text-emerald-600" : "text-muted-foreground"
                        }`}
                      >
                        {day.getDate()}
                      </div>
                      <div className="space-y-1">
                        {dayItems.slice(0, 3).map((item) => (
                          <button
                            type="button"
                            key={`${item.source}-${item._id}`}
                            className={`block w-full truncate rounded px-1 py-0.5 text-left text-[11px] ${TYPE_STYLES[item.type]}`}
                            title={item.title}
                            onClick={(e) => {
                              e.stopPropagation()
                              if (item.source === "assignment") {
                                router.push(`/assignments/${item._id}`)
                              } else if (canEditItem(item)) {
                                openEdit(item)
                              }
                            }}
                          >
                            {item.title}
                          </button>
                        ))}
                        {dayItems.length > 3 && (
                          <div className="px-1 text-[11px] text-muted-foreground">
                            +{dayItems.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </AsyncState>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Coming up</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcoming.length === 0 && (
              <p className="text-sm text-muted-foreground">Nothing scheduled ahead.</p>
            )}
            {upcoming.map((item) => (
              <div
                key={`${item.source}-${item._id}`}
                className="flex items-start justify-between gap-2 rounded-md border p-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge className={TYPE_STYLES[item.type]} variant="secondary">
                      {item.type}
                    </Badge>
                    {item.source === "assignment" && (
                      <span className="text-xs text-muted-foreground">due</span>
                    )}
                  </div>
                  <p className="mt-1 truncate text-sm font-medium">{item.title}</p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {new Date(item.start).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: item.allDay ? undefined : "short",
                    })}
                  </p>
                  {item.location && (
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {item.location}
                    </p>
                  )}
                  {item.course && (
                    <p className="text-xs text-muted-foreground">{item.course.title}</p>
                  )}
                </div>
                {canEditItem(item) && (
                  <div className="flex shrink-0 flex-col gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                      <Pencil className="h-3.5 w-3.5" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-600"
                      onClick={() => void remove(item)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit event" : "Add an event"}</DialogTitle>
            <DialogDescription>
              Events show on the calendar for everyone in the class, or the whole school when no
              class is chosen.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Parents' evening"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Starts</Label>
                <Input
                  type="datetime-local"
                  value={form.start}
                  onChange={(e) => setForm((f) => ({ ...f, start: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Ends (optional)</Label>
                <Input
                  type="datetime-local"
                  value={form.end}
                  onChange={(e) => setForm((f) => ({ ...f, end: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm((f) => ({ ...f, type: v as EventType }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="class">Class</SelectItem>
                    <SelectItem value="exam">Exam</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="holiday">Holiday</SelectItem>
                    <SelectItem value="event">Other event</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  placeholder="Main hall"
                />
              </div>
            </div>

            {!courseId && !editingId && (
              <div className="space-y-2">
                <Label>Class</Label>
                <Select
                  value={form.course || "school"}
                  onValueChange={(v) => setForm((f) => ({ ...f, course: v === "school" ? "" : v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="school">Whole school</SelectItem>
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
              <Label>Details (optional)</Label>
              <Textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.allDay}
                onChange={(e) => setForm((f) => ({ ...f, allDay: e.target.checked }))}
              />
              All-day event
            </label>

            {formError && <p className="text-sm text-red-600">{formError}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={() => void save()} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingId ? "Save changes" : "Add event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {confirmDialog}
    </div>
  )
}
