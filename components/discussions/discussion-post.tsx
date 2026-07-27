"use client"

import { useState } from "react"
import { Eye, Loader2, Lock, MessageSquare, Pin, Send } from "lucide-react"

import { useApi } from "@/hooks/use-api"
import { apiMutate } from "@/lib/api/client"
import { useRole } from "@/components/context/role-context"
import { AsyncState } from "@/components/ui/async-state"
import { BackButton } from "@/components/ui/back-button"
import { useConfirm } from "@/components/ui/confirm-dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { timeAgo, type DiscussionThread } from "@/components/discussions/discussion-board"

function initials(name?: string): string {
  if (!name) return "?"
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

/** One discussion thread: the opening post, every reply, and the reply box. */
export function DiscussionPost({ postId }: { postId: string }) {
  const { userId, isTeacher, isAdmin } = useRole()
  const canModerate = isTeacher || isAdmin
  const { data, error, isLoading, refetch } = useApi<DiscussionThread>(`/api/discussions/${postId}`)

  const [draft, setDraft] = useState("")
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState("")
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState("")
  const [confirm, confirmDialog] = useConfirm()

  const send = async () => {
    const body = draft.trim()
    if (!body) return
    setSending(true)
    setSendError("")
    try {
      await apiMutate(`/api/discussions/${postId}/replies`, "POST", { body })
      setDraft("")
      await refetch()
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Could not post your reply")
    } finally {
      setSending(false)
    }
  }

  const saveEdit = async (replyId: string) => {
    const body = editDraft.trim()
    if (!body) return
    await apiMutate(`/api/discussions/${postId}/replies`, "PATCH", { replyId, body })
    setEditingReplyId(null)
    await refetch()
  }

  const removeReply = async (replyId: string) => {
    const ok = await confirm({ title: "Delete this reply?" })
    if (!ok) return
    await apiMutate(`/api/discussions/${postId}/replies?replyId=${replyId}`, "DELETE")
    await refetch()
  }

  return (
    <div className="container mx-auto max-w-3xl space-y-6 p-6">
      <BackButton fallback="/discussions" label="Back to discussions" />

      <AsyncState isLoading={isLoading} error={error} onRetry={refetch}>
        {data && (
          <>
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  {data.pinned && <Pin className="h-4 w-4 text-emerald-600" />}
                  {data.locked && <Lock className="h-4 w-4 text-muted-foreground" />}
                  <CardTitle className="text-2xl">{data.title}</CardTitle>
                  <Badge variant="outline">{data.category}</Badge>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {initials(data.author?.name)}
                      </AvatarFallback>
                    </Avatar>
                    {data.author?.name ?? "Unknown"}
                  </span>
                  <span>{timeAgo(data.createdAt)}</span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {data.views}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    {data.replies.length}
                  </span>
                  {data.course && <span>{data.course.title}</span>}
                </div>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap leading-relaxed">{data.content}</p>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold">
                {data.replies.length} {data.replies.length === 1 ? "reply" : "replies"}
              </h2>

              {data.replies.map((reply) => {
                const mine = reply.author?._id === userId
                const isEditing = editingReplyId === reply._id

                return (
                  <Card key={reply._id}>
                    <CardContent className="space-y-2 py-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {initials(reply.author?.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{reply.author?.name ?? "Unknown"}</span>
                          <span className="text-muted-foreground">{timeAgo(reply.createdAt)}</span>
                          {reply.editedAt && (
                            <span className="text-xs text-muted-foreground">(edited)</span>
                          )}
                        </div>

                        {(mine || canModerate) && !isEditing && (
                          <div className="flex items-center gap-2 text-xs">
                            {mine && (
                              <button
                                type="button"
                                className="hover:underline"
                                onClick={() => {
                                  setEditingReplyId(reply._id)
                                  setEditDraft(reply.body)
                                }}
                              >
                                Edit
                              </button>
                            )}
                            <button
                              type="button"
                              className="text-red-600 hover:underline"
                              onClick={() => void removeReply(reply._id)}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>

                      {isEditing ? (
                        <div className="space-y-2">
                          <Textarea
                            rows={3}
                            value={editDraft}
                            onChange={(e) => setEditDraft(e.target.value)}
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => void saveEdit(reply._id)}>
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingReplyId(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap leading-relaxed">{reply.body}</p>
                      )}
                    </CardContent>
                  </Card>
                )
              })}

              {data.replies.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No replies yet — be the first to respond.
                </p>
              )}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {data.locked ? "This discussion is locked" : "Post a reply"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.locked ? (
                  <p className="text-sm text-muted-foreground">
                    A teacher has closed this thread to new replies.
                  </p>
                ) : (
                  <>
                    <Textarea
                      rows={4}
                      placeholder="Write your reply…"
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                    />
                    {sendError && <p className="text-sm text-red-600">{sendError}</p>}
                    <Button onClick={() => void send()} disabled={sending || !draft.trim()}>
                      {sending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="mr-2 h-4 w-4" />
                      )}
                      Post reply
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </AsyncState>

      {confirmDialog}
    </div>
  )
}
