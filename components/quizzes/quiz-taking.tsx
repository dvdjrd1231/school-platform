"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  PlayCircle,
  PauseCircle,
  CheckCircle,
  AlertTriangle,
  Send,
  BookOpen,
} from "lucide-react"
import Link from "next/link"

interface QuizTakingProps {
  quizId: string
}

const quizData = {
  id: 2,
  title: "Linear Equations Reading Comprehension",
  type: "reading-video",
  timeLimit: 45,
  questions: [
    {
      id: 1,
      type: "video-reading",
      title: "Watch the Video and Read the Material",
      videoUrl: "/educational-video-about-linear-equations.png",
      readingMaterial: `
        Linear equations are fundamental mathematical expressions that form straight lines when graphed. 
        They follow the general form y = mx + b, where:
        - m represents the slope of the line
        - b represents the y-intercept
        - x and y are variables
        
        Real-world applications of linear equations include:
        1. Calculating costs and profits in business
        2. Determining speed and distance in physics
        3. Analyzing trends in data science
        4. Planning budgets and financial projections
      `,
      question: "Based on the video and reading material, what does the 'm' represent in the equation y = mx + b?",
      options: ["The y-intercept", "The slope of the line", "The x-coordinate", "The constant term"],
      correctAnswer: 1,
    },
    {
      id: 2,
      type: "multiple-choice",
      question: "Which of the following is a real-world application of linear equations mentioned in the material?",
      options: [
        "Calculating compound interest",
        "Determining quadratic roots",
        "Analyzing business costs and profits",
        "Solving trigonometric problems",
      ],
      correctAnswer: 2,
    },
    {
      id: 3,
      type: "typing",
      question:
        "Explain in your own words how linear equations can be used in business planning. Provide a specific example.",
      placeholder: "Write your explanation here... (minimum 100 words)",
      minWords: 100,
    },
  ],
}

export function QuizTaking({ quizId }: QuizTakingProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<{ [key: number]: any }>({})
  const [timeRemaining, setTimeRemaining] = useState(quizData.timeLimit * 60) // in seconds
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const [videoWatched, setVideoWatched] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Auto-submit when time runs out
          handleSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleAnswerChange = (questionId: number, answer: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }))
  }

  const handleSubmit = () => {
    setIsSubmitted(true)
    // Here you would typically send the answers to the server
  }

  const currentQ = quizData.questions[currentQuestion]
  const progress = ((currentQuestion + 1) / quizData.questions.length) * 100

  if (isSubmitted) {
    return (
      <div className="flex-1 p-6 space-y-6">
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Quiz Submitted Successfully!</h2>
            <p className="text-muted-foreground mb-6">
              Your answers have been recorded. Results will be available shortly.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/quizzes">
                <Button variant="outline">Back to Quizzes</Button>
              </Link>
              <Button>View Results</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/quizzes">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Quizzes
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-balance">{quizData.title}</h1>
            <p className="text-muted-foreground">
              Question {currentQuestion + 1} of {quizData.questions.length}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className={`font-mono ${timeRemaining < 300 ? "text-red-600" : ""}`}>
                {formatTime(timeRemaining)}
              </span>
            </div>
            {timeRemaining < 300 && <p className="text-xs text-red-600">Time running out!</p>}
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Progress</span>
          <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Question Area */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="outline">Question {currentQuestion + 1}</Badge>
                {currentQ.type === "video-reading" && <BookOpen className="h-5 w-5" />}
                {currentQ.title || currentQ.question}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Video Content */}
              {currentQ.type === "video-reading" && (
                <div className="space-y-4">
                  <div className="aspect-video bg-muted rounded-lg flex items-center justify-center relative">
                    <img
                      src={currentQ.videoUrl || "/placeholder.svg"}
                      alt="Educational video"
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Button
                        size="lg"
                        onClick={() => {
                          setIsVideoPlaying(!isVideoPlaying)
                          if (!videoWatched) setVideoWatched(true)
                        }}
                      >
                        {isVideoPlaying ? (
                          <PauseCircle className="h-6 w-6 mr-2" />
                        ) : (
                          <PlayCircle className="h-6 w-6 mr-2" />
                        )}
                        {isVideoPlaying ? "Pause" : "Play"} Video
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium mb-2">Reading Material</h4>
                    <div className="prose prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap font-sans text-sm">{currentQ.readingMaterial}</pre>
                    </div>
                  </div>
                </div>
              )}

              {/* Question */}
              <div className="space-y-4">
                <h3 className="font-medium text-pretty">{currentQ.question}</h3>

                {/* Multiple Choice */}
                {(currentQ.type === "multiple-choice" || currentQ.type === "video-reading") && currentQ.options && (
                  <RadioGroup
                    value={answers[currentQ.id]?.toString() || ""}
                    onValueChange={(value) => handleAnswerChange(currentQ.id, Number.parseInt(value))}
                  >
                    {currentQ.options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                        <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}

                {/* Typing Question */}
                {currentQ.type === "typing" && (
                  <div className="space-y-2">
                    <Textarea
                      placeholder={currentQ.placeholder}
                      value={answers[currentQ.id] || ""}
                      onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                      className="min-h-32"
                    />
                    {currentQ.minWords && (
                      <p className="text-xs text-muted-foreground">
                        Word count: {(answers[currentQ.id] || "").split(" ").filter(Boolean).length} /{" "}
                        {currentQ.minWords} minimum
                      </p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Question Navigation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {quizData.questions.map((_, index) => (
                  <Button
                    key={index}
                    variant={currentQuestion === index ? "default" : answers[index + 1] ? "outline" : "ghost"}
                    size="sm"
                    onClick={() => setCurrentQuestion(index)}
                    className="relative"
                  >
                    {index + 1}
                    {answers[index + 1] && <CheckCircle className="h-3 w-3 absolute -top-1 -right-1 text-green-500" />}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quiz Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quiz Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Total Questions:</span>
                <span>{quizData.questions.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Answered:</span>
                <span>{Object.keys(answers).length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Time Limit:</span>
                <span>{quizData.timeLimit} minutes</span>
              </div>
            </CardContent>
          </Card>

          {/* Warnings */}
          {currentQ.type === "video-reading" && !videoWatched && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Watch the Video</p>
                    <p className="text-xs text-yellow-700">
                      Please watch the instructional video before answering the question.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
          disabled={currentQuestion === 0}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        <div className="flex gap-2">
          {currentQuestion < quizData.questions.length - 1 ? (
            <Button onClick={() => setCurrentQuestion(currentQuestion + 1)}>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
              <Send className="h-4 w-4 mr-2" />
              Submit Quiz
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
