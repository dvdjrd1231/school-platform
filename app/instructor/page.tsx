"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { BookOpen, Clock, Mail, MessageSquare, Users } from "lucide-react"

import { useApi } from "@/hooks/use-api"
import { apiMutate } from "@/lib/api/client"
import { useCourses } from "@/components/context/course-context"
import { AsyncState } from "@/components/ui/async-state"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Instructor {
  _id: string
  name?: string
  email?: string
  avatar?: string
  subject?: string
  officeHours?: string
  bio?: string
  department?: string
}

function initials(name?: string): string {
  if (!name) return "?"
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("")
}

/**
 * The instructor profile for the currently selected class.
 *
 * The page used to show a fixed fictional teacher. It now follows the course
 * picker: whichever class you're in, this is the person teaching it, the other
 * classes they take, and a way to message them.
 */
export default function InstructorProfilePage() {
  const router = useRouter()
  const { courses, selected, selectedId, isLoading } = useCourses()
  const [messaging, setMessaging] = useState(false)

  const instructorId = selected?.instructor?._id ?? null
  const profile = useApi<Instructor>(instructorId ? `/api/users/${instructorId}` : null)

  // The other classes this teacher takes, from the list we already have.
  const alsoTeaches = useMemo(
    () =>
      courses.filter(
        (c) => c.instructor?._id && c.instructor._id === instructorId && c._id !== selectedId,
      ),
    [courses, instructorId, selectedId],
  )

  const message = async () => {
    if (!instructorId) return
    setMessaging(true)
    try {
      const conversation = await apiMutate<{ _id: string }>("/api/conversations", "POST", {
        participantIds: [instructorId],
      })
      router.push(`/messages/${conversation._id}`)
    } catch {
      router.push("/messages")
    } finally {
      setMessaging(false)
    }
  }

  if (!isLoading && !selectedId) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            Choose a class from the sidebar to see who teaches it.
          </CardContent>
        </Card>
      </div>
    )
  }

  if (selected && !instructorId) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            {selected.title} has no teacher assigned yet.
          </CardContent>
        </Card>
      </div>
    )
  }

  const teacher = profile.data

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-emerald-600">Instructor</h1>
        <p className="text-muted-foreground">
          {selected ? `Who teaches ${selected.title}` : "Your teacher"}
        </p>
      </div>

      <AsyncState isLoading={profile.isLoading} error={profile.error} onRetry={profile.refetch}>
        {teacher && (
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardContent className="flex flex-col items-center gap-4 pt-6 text-center">
                <Avatar className="h-24 w-24">
                  {teacher.avatar && <AvatarImage src={teacher.avatar} alt={teacher.name ?? ""} />}
                  <AvatarFallback className="text-xl">{initials(teacher.name)}</AvatarFallback>
                </Avatar>

                <div>
                  <h2 className="text-xl font-semibold">{teacher.name}</h2>
                  {teacher.subject && <Badge className="mt-1">{teacher.subject}</Badge>}
                  {teacher.department && (
                    <p className="mt-1 text-sm text-muted-foreground">{teacher.department}</p>
                  )}
                </div>

                <div className="w-full space-y-2 border-t pt-4 text-left text-sm">
                  {teacher.email && (
                    <p className="flex items-center gap-2 break-all">
                      <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                      {teacher.email}
                    </p>
                  )}
                  <p className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    {teacher.officeHours ?? "No office hours listed"}
                  </p>
                </div>

                <Button className="w-full" onClick={() => void message()} disabled={messaging}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Send a message
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-6 lg:col-span-2">
              {teacher.bio && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">About</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap leading-relaxed">{teacher.bio}</p>
                  </CardContent>
                </Card>
              )}

              {selected && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <BookOpen className="h-5 w-5" />
                      This class
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p className="font-medium">{selected.title}</p>
                    <p className="text-muted-foreground">
                      {selected.subject}
                      {selected.schedule ? ` · ${selected.schedule}` : ""}
                      {selected.room ? ` · Room ${selected.room}` : ""}
                    </p>
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      {selected.enrolledCount ?? 0}
                      {selected.maxStudents ? ` / ${selected.maxStudents}` : ""} enrolled
                    </p>
                    <Button variant="outline" onClick={() => router.push(`/courses/${selected._id}`)}>
                      Open the course
                    </Button>
                  </CardContent>
                </Card>
              )}

              {alsoTeaches.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Also teaches</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {alsoTeaches.map((course) => (
                      <button
                        type="button"
                        key={course._id}
                        className="block w-full rounded border p-3 text-left text-sm hover:bg-muted/50"
                        onClick={() => router.push(`/courses/${course._id}`)}
                      >
                        <span className="font-medium">{course.title}</span>
                        {course.schedule && (
                          <span className="block text-xs text-muted-foreground">
                            {course.schedule}
                          </span>
                        )}
                      </button>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </AsyncState>
    </div>
  )
}
