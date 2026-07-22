import { Sidebar } from "@/components/layout/sidebar"
import { QuizTaking } from "@/components/quizzes/quiz-taking"

interface QuizTakingPageProps {
  params: Promise<{ quizId: string }>
}

export default async function QuizTakingPage({ params }: QuizTakingPageProps) {
  const { quizId } = await params

  return (
    <div className="flex w-full">
      <Sidebar />
      <div className="flex-1">
        <QuizTaking quizId={quizId} />
      </div>
    </div>
  )
}
