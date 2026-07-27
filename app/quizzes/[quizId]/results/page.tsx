import { QuizResults } from "@/components/quizzes/quiz-results"

interface QuizResultsPageProps {
  params: Promise<{ quizId: string }>
}

export default async function QuizResultsPage({ params }: QuizResultsPageProps) {
  const { quizId } = await params
  return <QuizResults quizId={quizId} />
}
