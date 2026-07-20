"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Clock, Users, CheckCircle, AlertCircle } from "lucide-react"
import { getSurveys } from "@/lib/database"
import { useRouter } from "next/navigation"

export default function SurveysPage() {
  const [surveys, setSurveys] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => {
    setSurveys(getSurveys())
  }, [])

  const handleSurveyClick = (surveyId: string) => {
    router.push(`/surveys/${surveyId}`)
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-emerald-600">My Surveys</h1>
        <p className="text-muted-foreground">Complete surveys and provide feedback</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {surveys.map((survey) => (
          <Card
            key={survey.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => handleSurveyClick(survey.id)}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <FileText className="h-6 w-6 text-emerald-600" />
                <Badge
                  variant={
                    survey.status === "completed"
                      ? "default"
                      : survey.status === "pending"
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {survey.status}
                </Badge>
              </div>
              <CardTitle className="text-lg">{survey.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{survey.description}</p>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4" />
                  <span>Due: {survey.dueDate}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4" />
                  <span>{survey.responses} responses</span>
                </div>
              </div>

              <Button
                className="w-full mt-4"
                variant={survey.status === "completed" ? "outline" : "default"}
                onClick={() => handleSurveyClick(survey.id)}
              >
                {survey.status === "completed" ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    View Results
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Take Survey
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
