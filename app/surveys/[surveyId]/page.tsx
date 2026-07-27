import { SurveyDetail } from "@/components/surveys/survey-detail"

interface SurveyPageProps {
  params: Promise<{ surveyId: string }>
}

export default async function SurveyPage({ params }: SurveyPageProps) {
  const { surveyId } = await params
  return <SurveyDetail surveyId={surveyId} />
}
