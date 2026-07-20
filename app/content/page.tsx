import { Sidebar } from "@/components/layout/sidebar"
import { CourseContent } from "@/components/content/course-content"

export default function ContentPage() {
  return (
    <div className="flex w-full">
      <Sidebar />
      <div className="flex-1">
        <CourseContent />
      </div>
    </div>
  )
}
