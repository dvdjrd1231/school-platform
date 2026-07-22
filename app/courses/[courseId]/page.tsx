import { notFound } from "next/navigation"
import { getCourseById, getModulesByCourse } from "@/lib/database"
import CourseModules from "@/components/courses/course-modules"

interface CoursePageProps {
  params: Promise<{ courseId: string }>
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { courseId } = await params

  const course = getCourseById(courseId)

  if (!course) {
    notFound()
  }

  const modules = getModulesByCourse(course.id)

  return <CourseModules course={course} modules={modules} />
}
