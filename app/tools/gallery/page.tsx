"use client"

import { useCourses } from "@/components/context/course-context"
import { FileLibrary } from "@/components/files/file-library"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

/**
 * The class media gallery: files shared with a whole class rather than kept
 * private. It's the same file area as My Media, scoped to the selected class
 * and defaulting new uploads to class-visible.
 */
export default function ClassMediaGalleryPage() {
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
        <FileLibrary
          key={selectedId}
          context="gallery"
          courseId={selectedId}
          defaultVisibility="course"
          title="Class Media Gallery"
          description="Photos, video and files shared with everyone in this class"
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
