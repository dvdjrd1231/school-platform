"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, Clock, FileText } from "lucide-react"
import { useRouter } from "next/navigation"

interface SurveyQuestion {
  id: number
  type: "multiple-choice" | "text" | "rating"
  question: string
  options?: string[]
  required: boolean
}

export default function SurveyDetailPage({ params }: { params: { surveyId: string } }) {
  const router = useRouter()
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [isCompleted, setIsCompleted] = useState(false)

  // Mock survey data - in real app, fetch based on surveyId
  const survey = {
    id: params.surveyId,
    title: "Course Feedback Survey",
    description: "Help us improve the course content and delivery",
    estimatedTime: 5,
    questions: [
      {
        id: 1,
        type: "multiple-choice" as const,
        question: "How would you rate the overall course content?",
        options: ["Excellent", "Good", "Average", "Poor", "Very Poor"],
        required: true,
      },
      {
        id: 2,
        type: "multiple-choice" as const,
        question: "How clear were the course instructions?",
        options: ["Very Clear", "Clear", "Somewhat Clear", "Unclear", "Very Unclear"],
        required: true,
      },
      {
        id: 3,
        type: "text" as const,
        question: "What topics would you like to see covered in more detail?",
        required: false,
      },
      {
        id: 4,
        type: "rating" as const,
        question: "Rate your instructor's teaching effectiveness (1-5)",
        options: ["1", "2", "3", "4", "5"],
        required: true,
      },
      {
        id: 5,
        type: "text" as const,
        question: "Any additional comments or suggestions?",
        required: false,
      },
    ] as SurveyQuestion[],
  }

  const handleAnswerChange = (questionId: number, answer: string) => {
    setAnswers({ ...answers, [questionId]: answer })
  }

  const handleNext = () => {
    if (currentQuestion < survey.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const handleSubmit = () => {
    // In real app, submit answers to backend
    setIsCompleted(true)
  }

  const currentQ = survey.questions[currentQuestion]
  const progress = ((currentQuestion + 1) / survey.questions.length) * 100

  if (isCompleted) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Survey Completed!</h2>
            <p className="text-gray-600 mb-6">Thank you for your feedback. Your responses have been recorded.</p>
            <Button onClick={() => router.push("/surveys")} className="bg-emerald-600 hover:bg-emerald-700">
              Back to Surveys
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-5 w-5 text-emerald-600" />
              <span className="text-sm text-gray-500">Survey</span>
            </div>
            <CardTitle className="text-2xl">{survey.title}</CardTitle>
            <p className="text-gray-600">{survey.description}</p>
            <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>~{survey.estimatedTime} minutes</span>
              </div>
              <span>
                Question {currentQuestion + 1} of {survey.questions.length}
              </span>
            </div>
          </CardHeader>
        </Card>

        {/* Progress */}
        <div className="mb-6">
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question */}
        <Card>
          <CardContent className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-4">
                {currentQ.question}
                {currentQ.required && <span className="text-red-500 ml-1">*</span>}
              </h3>

              {currentQ.type === "multiple-choice" && (
                <RadioGroup
                  value={answers[currentQ.id] || ""}
                  onValueChange={(value) => handleAnswerChange(currentQ.id, value)}
                >
                  {currentQ.options?.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <RadioGroupItem value={option} id={`option-${index}`} />
                      <Label htmlFor={`option-${index}`}>{option}</Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {currentQ.type === "rating" && (
                <RadioGroup
                  value={answers[currentQ.id] || ""}
                  onValueChange={(value) => handleAnswerChange(currentQ.id, value)}
                >
                  <div className="flex gap-4">
                    {currentQ.options?.map((option, index) => (
                      <div key={index} className="flex flex-col items-center space-y-2">
                        <RadioGroupItem value={option} id={`rating-${index}`} />
                        <Label htmlFor={`rating-${index}`} className="text-sm">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              )}

              {currentQ.type === "text" && (
                <Textarea
                  value={answers[currentQ.id] || ""}
                  onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                  placeholder="Enter your response..."
                  rows={4}
                />
              )}
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              <Button variant="outline" onClick={handlePrevious} disabled={currentQuestion === 0}>
                Previous
              </Button>

              {currentQuestion === survey.questions.length - 1 ? (
                <Button
                  onClick={handleSubmit}
                  className="bg-emerald-600 hover:bg-emerald-700"
                  disabled={currentQ.required && !answers[currentQ.id]}
                >
                  Submit Survey
                </Button>
              ) : (
                <Button onClick={handleNext} disabled={currentQ.required && !answers[currentQ.id]}>
                  Next
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
