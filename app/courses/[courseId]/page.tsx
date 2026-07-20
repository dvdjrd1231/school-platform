import { notFound } from "next/navigation"
import { getCourseById, getModulesByCourse } from "@/lib/database"
import CourseModules from "@/components/courses/course-modules"

interface CoursePageProps {
  params: {
    courseId: string
  }
}

export default function CoursePage({ params }: CoursePageProps) {
  const course = getCourseById(params.courseId)

  if (!course) {
    notFound()
  }

  const modules = getModulesByCourse(course.id)

  return <CourseModules course={course} modules={modules} />
}
