import { Suspense } from "react"
import { CourseContent } from "@/components/content/course-content"

export default function ClassroomContentPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Course Content</h1>
        <p className="text-gray-600 mt-2">Access your course materials, lessons, and resources</p>
      </div>

      <Suspense fallback={<div>Loading content...</div>}>
        <CourseContent />
      </Suspense>
    </div>
  )
}
