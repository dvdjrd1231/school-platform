import { SurveyList } from "@/components/surveys/survey-list"

/** Same surveys area as /surveys — this is the "More Tools" entry to it. */
export default function ToolsSurveysPage() {
  return (
    <div className="container mx-auto p-6">
      <SurveyList />
    </div>
  )
}
