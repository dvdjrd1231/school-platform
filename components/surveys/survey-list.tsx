"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { BarChart3, CheckCircle, ClipboardList, Loader2, Pencil, Plus, Trash2, Users } from "lucide-react"

import { useApi } from "@/hooks/use-api"
import { apiMutate } from "@/lib/api/client"
import { useRole } from "@/components/context/role-context"
import { AsyncState } from "@/components/ui/async-state"
import { useConfirm } from "@/components/ui/confirm-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SurveyEditorDialog } from "@/components/surveys/survey-editor-dialog"

export interface SurveyListItem {
  _id: string
  title: string
  description?: string
  audience: ("student" | "parent" | "teacher")[]
  status: "draft" | "open" | "closed"
  anonymous: boolean
  closesAt?: string
  questionCount: number
  responseCount: number
  alreadyAnswered: boolean | null
  isMine: boolean
  createdBy?: { name?: string } | null
  course?: { _id: string; title: string } | null
}

/**
 * The surveys screen.
 *
 * "Create survey" used to do nothing. Teachers and admins now write surveys,
 * choose whether students, parents or teachers are asked, open and close them,
 * and read the collated results.
 */
export function SurveyList() {
  const router = useRouter()
  const { isTeacher, isAdmin } = useRole()
  const isStaff = isTeacher || isAdmin

  const { data, error, isLoading, refetch } = useApi<{ surveys: SurveyListItem[] }>("/api/surveys")
  const surveys = data?.surveys ?? []

  const [editing, setEditing] = useState<{ surveyId?: string } | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [confirm, confirmDialog] = useConfirm()

  const setStatus = async (survey: SurveyListItem, status: SurveyListItem["status"]) => {
    setBusyId(survey._id)
    try {
      await apiMutate(`/api/surveys/${survey._id}`, "PATCH", { status })
      await refetch()
    } finally {
      setBusyId(null)
    }
  }

  const remove = async (survey: SurveyListItem) => {
    const ok = await confirm({
      title: `Delete "${survey.title}"?`,
      description: `The survey and its ${survey.responseCount} response(s) will be permanently removed. This cannot be undone.`,
      requireText: "delete",
    })
    if (!ok) return
    await apiMutate(`/api/surveys/${survey._id}`, "DELETE")
    await refetch()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-emerald-600">Surveys</h1>
          <p className="text-muted-foreground">
            {isStaff
              ? "Ask students, parents or staff a set of questions and read the answers."
              : "Surveys you've been asked to fill in."}
          </p>
        </div>
        {isStaff && (
          <Button onClick={() => setEditing({})}>
            <Plus className="mr-2 h-4 w-4" />
            Create survey
          </Button>
        )}
      </div>

      <AsyncState
        isLoading={isLoading}
        error={error}
        isEmpty={surveys.length === 0}
        emptyMessage={
          isStaff ? "No surveys yet — create your first one." : "Nothing to fill in right now."
        }
        onRetry={refetch}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {surveys.map((survey) => (
            <Card key={survey._id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className="text-lg">{survey.title}</CardTitle>
                    {survey.description && (
                      <p className="text-sm text-muted-foreground">{survey.description}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Badge
                      variant={
                        survey.status === "open"
                          ? "default"
                          : survey.status === "closed"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {survey.status}
                    </Badge>
                    {survey.anonymous && <Badge variant="outline">Anonymous</Badge>}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <ClipboardList className="h-4 w-4" />
                    {survey.questionCount} question{survey.questionCount === 1 ? "" : "s"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {survey.audience.join(", ")}
                  </span>
                  {survey.course && <span>{survey.course.title}</span>}
                  {survey.closesAt && (
                    <span>
                      Closes{" "}
                      {new Date(survey.closesAt).toLocaleDateString(undefined, {
                        dateStyle: "medium",
                      })}
                    </span>
                  )}
                </div>

                {survey.isMine && (
                  <p className="text-sm text-muted-foreground">
                    {survey.responseCount} response{survey.responseCount === 1 ? "" : "s"}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 pt-1">
                  {survey.alreadyAnswered ? (
                    <span className="flex items-center gap-1 text-sm text-green-700">
                      <CheckCircle className="h-4 w-4" />
                      You&apos;ve answered this
                    </span>
                  ) : (
                    survey.status === "open" && (
                      <Button size="sm" onClick={() => router.push(`/surveys/${survey._id}`)}>
                        {survey.alreadyAnswered === null ? "Answer" : "Fill in"}
                      </Button>
                    )
                  )}

                  {survey.isMine && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/surveys/${survey._id}`)}
                      >
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Results
                      </Button>
                      {survey.status === "draft" && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyId === survey._id}
                          onClick={() => void setStatus(survey, "open")}
                        >
                          {busyId === survey._id && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Open it
                        </Button>
                      )}
                      {survey.status === "open" && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyId === survey._id}
                          onClick={() => void setStatus(survey, "closed")}
                        >
                          Close it
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditing({ surveyId: survey._id })}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600"
                        onClick={() => void remove(survey)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </AsyncState>

      {editing && (
        <SurveyEditorDialog
          open
          surveyId={editing.surveyId}
          onOpenChange={(isOpen: boolean) => !isOpen && setEditing(null)}
          onSaved={() => {
            setEditing(null)
            void refetch()
          }}
        />
      )}

      {confirmDialog}
    </div>
  )
}
