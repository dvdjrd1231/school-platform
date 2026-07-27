"use client"

import { useMemo } from "react"
import { CalendarDays, Clock, MapPin } from "lucide-react"

import { useApi } from "@/hooks/use-api"
import { AsyncState } from "@/components/ui/async-state"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileLibrary } from "@/components/files/file-library"

interface SeminarEvent {
  _id: string
  title: string
  description?: string
  type: string
  start: string
  end?: string
  location?: string
  course?: { _id: string; title: string } | null
}

/**
 * Seminars: what's scheduled, and the materials that go with them.
 *
 * Sessions come from the calendar (events of type "meeting"), so a seminar is
 * scheduled the same way as everything else rather than kept in a second, rival
 * list that has to be maintained separately. Materials use the shared file area,
 * so they can be filed under the admin's categories like everything else.
 */
export default function SeminarPage() {
  const from = useMemo(() => new Date().toISOString(), [])
  const { data, error, isLoading, refetch } = useApi<{ events: SeminarEvent[] }>(
    `/api/events?from=${from}`,
  )

  const seminars = (data?.events ?? []).filter((e) => e.type === "meeting")

  return (
    <div className="container mx-auto space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-bold text-emerald-600">Seminars</h1>
        <p className="text-muted-foreground">
          Upcoming sessions and their materials. Teachers schedule a seminar from the calendar as an
          event of type &ldquo;meeting&rdquo;.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="h-5 w-5" />
            Coming up
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AsyncState
            isLoading={isLoading}
            error={error}
            isEmpty={seminars.length === 0}
            emptyMessage="No seminars are scheduled. Add one from the calendar."
            onRetry={refetch}
          >
            <div className="space-y-3">
              {seminars.map((seminar) => (
                <div key={seminar._id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{seminar.title}</p>
                      {seminar.description && (
                        <p className="text-sm text-muted-foreground">{seminar.description}</p>
                      )}
                      <div className="mt-1 flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {new Date(seminar.start).toLocaleString(undefined, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </span>
                        {seminar.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {seminar.location}
                          </span>
                        )}
                      </div>
                    </div>
                    {seminar.course && <Badge variant="outline">{seminar.course.title}</Badge>}
                  </div>
                </div>
              ))}
            </div>
          </AsyncState>
        </CardContent>
      </Card>

      <FileLibrary
        context="seminar"
        title="Seminar materials"
        description="Slides, handouts and recordings, filed by category"
        defaultVisibility="school"
      />
    </div>
  )
}
