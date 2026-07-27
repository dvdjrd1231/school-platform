"use client"

import { useCourses } from "@/components/context/course-context"
import { SchoolCalendar } from "@/components/calendar/school-calendar"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

/**
 * The classroom calendar — the same calendar, scoped to the selected class.
 *
 * Remounting on `selectedId` (via `key`) resets the month cursor and refetches
 * for the new class rather than leaving the previous class's events on screen.
 */
export default function ClassroomCalendarPage() {
  const { courses, selectedId, select, isLoading } = useCourses()

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex justify-end">
        <div className="w-72">
          <Select value={selectedId ?? undefined} onValueChange={select}>
            <SelectTrigger>
              <SelectValue placeholder={isLoading ? "Loading…" : "Choose a class"} />
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
      </div>

      {selectedId ? (
        <SchoolCalendar
          key={selectedId}
          courseId={selectedId}
          title="Classroom calendar"
          description="Lessons, deadlines and events for this class"
        />
      ) : (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            {isLoading ? "Loading your classes…" : "You have no classes yet."}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
