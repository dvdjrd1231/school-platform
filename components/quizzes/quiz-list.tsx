"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlayCircle, CheckSquare, PenTool, Clock, Trophy, Video, FileText, Star, Calendar, Users } from "lucide-react"
import Link from "next/link"
import { getQuizzes, type Quiz } from "@/lib/database"

const getStatusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "text-green-600"
    case "in-progress":
      return "text-blue-600"
    case "available":
      return "text-primary"
    default:
      return "text-muted-foreground"
  }
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "completed":
      return <Badge className="bg-green-100 text-green-800">Completed</Badge>
    case "in-progress":
      return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>
    case "available":
      return <Badge className="bg-primary/10 text-primary">Available</Badge>
    default:
      return <Badge variant="secondary">Locked</Badge>
  }
}

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case "Easy":
      return "text-green-600"
    case "Medium":
      return "text-yellow-600"
    case "Hard":
      return "text-red-600"
    default:
      return "text-muted-foreground"
  }
}

const getModuleIcon = (type: string) => {
  switch (type) {
    case "multiple-choice":
      return <CheckSquare className="h-5 w-5" />
    case "reading-video":
      return <PlayCircle className="h-5 w-5" />
    case "typing":
      return <PenTool className="h-5 w-5" />
    default:
      return <FileText className="h-5 w-5" />
  }
}

export function QuizList() {
  const [selectedModule, setSelectedModule] = useState("all")

  const quizzes: Quiz[] = getQuizzes()

  const filteredQuizzes = quizzes.filter((quiz) => selectedModule === "all" || quiz.type === selectedModule)

  const stats = {
    total: quizzes.length,
    completed: quizzes.filter((q) => q.status === "completed").length,
    available: quizzes.filter((q) => q.status === "available").length,
    inProgress: quizzes.filter((q) => q.status === "in-progress").length,
  }

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-balance">Quizzes</h1>
          <p className="text-muted-foreground">Mathematics - Grade 10</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Average Score</p>
            <p className="text-lg font-semibold">81.5%</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">{stats.total} Total</p>
                <p className="text-xs text-muted-foreground">All quizzes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">{stats.completed} Completed</p>
                <p className="text-xs text-muted-foreground">Finished quizzes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">{stats.inProgress} In Progress</p>
                <p className="text-xs text-muted-foreground">Started quizzes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">{stats.available} Available</p>
                <p className="text-xs text-muted-foreground">Ready to take</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Module Tabs */}
      <Tabs value={selectedModule} onValueChange={setSelectedModule}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Quizzes</TabsTrigger>
          <TabsTrigger value="multiple-choice">Multiple Choice</TabsTrigger>
          <TabsTrigger value="reading-video">Reading & Video</TabsTrigger>
          <TabsTrigger value="typing">Typing Module</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedModule} className="space-y-4 mt-6">
          {filteredQuizzes.map((quiz) => (
            <Card key={quiz.id} className={`${quiz.status === "locked" ? "opacity-60" : ""}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        {getModuleIcon(quiz.type)}
                        <h3 className="text-lg font-semibold text-balance">{quiz.title}</h3>
                      </div>
                      {getStatusBadge(quiz.status)}
                      <Badge variant="outline" className={getDifficultyColor(quiz.difficulty)}>
                        {quiz.difficulty}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mb-3 text-pretty">{quiz.description}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                      <span className="font-medium text-primary">{quiz.module}</span>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm font-medium">{quiz.points} points</p>
                    {quiz.bestScore && <p className="text-sm text-green-600">Best: {quiz.bestScore}%</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>{quiz.questions} questions</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{quiz.timeLimit} minutes</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {quiz.attempts}/{quiz.maxAttempts} attempts
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Due: {new Date(quiz.dueDate).toLocaleDateString()}</span>
                  </div>
                </div>

                {quiz.type === "reading-video" && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Video className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">Video Content Included</span>
                    </div>
                    <p className="text-sm text-blue-700">
                      This quiz includes instructional video content that you'll need to watch before answering
                      questions.
                    </p>
                  </div>
                )}

                {quiz.attempts > 0 && quiz.status !== "completed" && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Progress</span>
                      <span className="text-sm text-muted-foreground">
                        {quiz.status === "in-progress" ? "65%" : "0%"}
                      </span>
                    </div>
                    <Progress value={quiz.status === "in-progress" ? 65 : 0} className="h-2" />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {quiz.status === "completed" ? (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Trophy className="h-4 w-4 mr-2" />
                          View Results
                        </Button>
                        {quiz.attempts < quiz.maxAttempts && (
                          <Link href={`/quizzes/${quiz.id}`}>
                            <Button size="sm">Retake Quiz</Button>
                          </Link>
                        )}
                      </div>
                    ) : quiz.status === "in-progress" ? (
                      <Link href={`/quizzes/${quiz.id}`}>
                        <Button size="sm">
                          <PlayCircle className="h-4 w-4 mr-2" />
                          Continue Quiz
                        </Button>
                      </Link>
                    ) : quiz.status === "available" ? (
                      <Link href={`/quizzes/${quiz.id}`}>
                        <Button size="sm">
                          <PlayCircle className="h-4 w-4 mr-2" />
                          Start Quiz
                        </Button>
                      </Link>
                    ) : (
                      <Button size="sm" disabled>
                        Locked
                      </Button>
                    )}
                  </div>
                  {quiz.bestScore && (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-medium">{quiz.bestScore}%</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}
