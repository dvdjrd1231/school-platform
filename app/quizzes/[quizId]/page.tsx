import { Sidebar } from "@/components/layout/sidebar"
import { QuizTaking } from "@/components/quizzes/quiz-taking"

interface QuizTakingPageProps {
  params: {
    quizId: string
  }
}

export default function QuizTakingPage({ params }: QuizTakingPageProps) {
  return (
    <div className="flex w-full">
      <Sidebar />
      <div className="flex-1">
        <QuizTaking quizId={params.quizId} />
      </div>
    </div>
  )
}
