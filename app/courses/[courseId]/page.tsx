import CourseModules from "@/components/courses/course-modules"

interface CoursePageProps {
  params: Promise<{ courseId: string }>
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { courseId } = await params
  return <CourseModules courseId={courseId} />
}
