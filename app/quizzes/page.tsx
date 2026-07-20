import { Sidebar } from "@/components/layout/sidebar"
import { QuizList } from "@/components/quizzes/quiz-list"

export default function QuizzesPage() {
  return (
    <div className="flex w-full">
      <Sidebar />
      <div className="flex-1">
        <QuizList />
      </div>
    </div>
  )
}
