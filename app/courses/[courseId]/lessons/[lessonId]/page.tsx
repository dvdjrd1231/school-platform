import { LessonViewer } from "@/components/courses/lesson-viewer"

interface LessonPageProps {
  params: Promise<{ courseId: string; lessonId: string }>
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { courseId, lessonId } = await params
  return <LessonViewer courseId={courseId} lessonId={lessonId} />
}
