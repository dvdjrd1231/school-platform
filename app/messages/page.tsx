"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { Loader2, MessageSquare, Plus, Send } from "lucide-react"

import { useApi } from "@/hooks/use-api"
import { useRealtimeChannel, isRealtimeEnabled } from "@/hooks/use-realtime"
import { apiGet, apiMutate } from "@/lib/api/client"
import { AsyncState } from "@/components/ui/async-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface Participant {
  _id: string
  name?: string
  email?: string
  roles?: string[]
}

interface Conversation {
  _id: string
  subject?: string
  participants: Participant[]
  regardingStudent?: { _id: string; name?: string } | null
  lastMessage?: string
  lastMessageAt?: string
  unreadCount?: number
}

interface Message {
  _id: string
  conversation: string
  sender?: Participant | string
  body: string
  createdAt: string
}

interface Contact {
  _id: string
  name: string
  email: string
  roles: string[]
  studentId?: string
}

function senderId(m: Message): string {
  return typeof m.sender === "string" ? m.sender : (m.sender?._id ?? "")
}

function senderName(m: Message): string {
  return typeof m.sender === "string" ? "" : (m.sender?.name ?? "")
}

export default function MessagesPage() {
  const { data: session } = useSession()
  const meId = session?.user?.id ?? ""
  // On /messages/[id] (e.g. from a message notification) this pre-opens that
  // conversation; on /messages it's undefined and we open the first thread.
  const routeConversationId = String((useParams() as { id?: string })?.id ?? "")

  const conversationsReq = useApi<{ conversations: Conversation[] }>("/api/conversations")
  const conversations = useMemo(
    () => conversationsReq.data?.conversations ?? [],
    [conversationsReq.data],
  )

  const [activeId, setActiveId] = useState<string>("")
  const [messages, setMessages] = useState<Message[]>([])
  const [loadingThread, setLoadingThread] = useState(false)
  const [threadError, setThreadError] = useState("")
  const [draft, setDraft] = useState("")
  const [sending, setSending] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)

  // Pick the conversation to open: the one named in the URL if present
  // (a notification deep-link), otherwise the most recent. The route id can be
  // opened immediately — loadThread fetches it whether or not the list is ready.
  useEffect(() => {
    if (activeId) return
    if (routeConversationId) setActiveId(routeConversationId)
    else if (conversations.length > 0) setActiveId(conversations[0]._id)
  }, [conversations, activeId, routeConversationId])

  const loadThread = useCallback(async (id: string) => {
    if (!id) return
    setLoadingThread(true)
    setThreadError("")
    try {
      const data = await apiGet<{ messages: Message[] }>(`/api/conversations/${id}/messages`)
      setMessages(data.messages ?? [])
    } catch (err) {
      setThreadError(err instanceof Error ? err.message : "Could not load messages")
    } finally {
      setLoadingThread(false)
    }
  }, [])

  useEffect(() => {
    void loadThread(activeId)
  }, [activeId, loadThread])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Live delivery for the open thread. No-op when Pusher isn't configured.
  useRealtimeChannel(
    activeId ? `private-conversation-${activeId}` : null,
    "new-message",
    useCallback(
      (payload: unknown) => {
        const incoming = payload as Message
        if (!incoming?._id) return
        setMessages((prev) =>
          // The sender already appended optimistically; don't double up.
          prev.some((m) => m._id === incoming._id) ? prev : [...prev, incoming],
        )
      },
      [],
    ),
  )

  // Inbox badge updates for threads that aren't open.
  useRealtimeChannel(
    meId ? `private-user-${meId}` : null,
    "new-message",
    useCallback(() => {
      void conversationsReq.refetch()
    }, [conversationsReq]),
  )

  const send = async () => {
    const body = draft.trim()
    if (!body || !activeId) return

    setSending(true)
    try {
      const created = await apiMutate<Message>(
        `/api/conversations/${activeId}/messages`,
        "POST",
        { body },
      )
      setMessages((prev) => (prev.some((m) => m._id === created._id) ? prev : [...prev, created]))
      setDraft("")
      void conversationsReq.refetch()
    } catch (err) {
      setThreadError(err instanceof Error ? err.message : "Could not send the message")
    } finally {
      setSending(false)
    }
  }

  const active = conversations.find((c) => c._id === activeId)

  const titleFor = (c: Conversation) => {
    if (c.subject) return c.subject
    const others = c.participants.filter((p) => p._id !== meId).map((p) => p.name ?? p.email)
    return others.join(", ") || "Conversation"
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-emerald-600">Messages</h1>
          <p className="text-muted-foreground">
            {isRealtimeEnabled()
              ? "Conversations between parents, teachers, and staff."
              : "Conversations between parents, teachers, and staff. New messages appear on refresh."}
          </p>
        </div>
        <NewConversationDialog
          onCreated={async (id) => {
            await conversationsReq.refetch()
            setActiveId(id)
          }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversation list */}
        <Card className="lg:col-span-1">
          <CardContent className="p-0">
            <AsyncState
              isLoading={conversationsReq.isLoading}
              error={conversationsReq.error}
              isEmpty={conversations.length === 0}
              emptyMessage="No conversations yet."
              onRetry={conversationsReq.refetch}
            >
              <ul className="divide-y">
                {conversations.map((c) => (
                  <li key={c._id}>
                    <button
                      type="button"
                      onClick={() => setActiveId(c._id)}
                      className={cn(
                        "w-full px-4 py-3 text-left transition-colors hover:bg-muted/60",
                        c._id === activeId && "bg-muted",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-medium line-clamp-1">{titleFor(c)}</span>
                        {(c.unreadCount ?? 0) > 0 && (
                          <Badge className="bg-emerald-600">{c.unreadCount}</Badge>
                        )}
                      </div>
                      {c.regardingStudent?.name && (
                        <p className="text-xs text-muted-foreground">
                          About {c.regardingStudent.name}
                        </p>
                      )}
                      {c.lastMessage && (
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                          {c.lastMessage}
                        </p>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </AsyncState>
          </CardContent>
        </Card>

        {/* Thread */}
        <Card className="lg:col-span-2 flex flex-col">
          <CardContent className="flex flex-1 flex-col p-0">
            {!activeId ? (
              <div className="flex flex-1 items-center justify-center py-16 text-muted-foreground">
                <MessageSquare className="mr-2 h-5 w-5" />
                Select a conversation
              </div>
            ) : (
              <>
                <div className="border-b px-4 py-3">
                  <p className="font-medium">{active ? titleFor(active) : "Conversation"}</p>
                  {active?.regardingStudent?.name && (
                    <p className="text-xs text-muted-foreground">
                      Regarding {active.regardingStudent.name}
                    </p>
                  )}
                </div>

                <div className="min-h-[320px] max-h-[52vh] flex-1 space-y-3 overflow-y-auto p-4">
                  {loadingThread ? (
                    <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading messages…
                    </div>
                  ) : messages.length === 0 ? (
                    <p className="py-12 text-center text-sm text-muted-foreground">
                      No messages yet. Say hello.
                    </p>
                  ) : (
                    messages.map((m) => {
                      const mine = senderId(m) === meId
                      return (
                        <div
                          key={m._id}
                          className={cn("flex flex-col", mine ? "items-end" : "items-start")}
                        >
                          <div
                            className={cn(
                              "max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap",
                              mine ? "bg-emerald-600 text-white" : "bg-muted",
                            )}
                          >
                            {m.body}
                          </div>
                          <span className="mt-1 text-xs text-muted-foreground">
                            {!mine && senderName(m) ? `${senderName(m)} · ` : ""}
                            {new Date(m.createdAt).toLocaleString()}
                          </span>
                        </div>
                      )
                    })
                  )}
                  <div ref={bottomRef} />
                </div>

                {threadError && (
                  <p className="px-4 pb-2 text-sm text-red-600" role="alert">
                    {threadError}
                  </p>
                )}

                <div className="flex items-end gap-2 border-t p-3">
                  <Textarea
                    rows={2}
                    placeholder="Write a message…"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      // Enter sends; Shift+Enter makes a new line.
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        void send()
                      }
                    }}
                  />
                  <Button onClick={send} disabled={sending || !draft.trim()}>
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function NewConversationDialog({ onCreated }: { onCreated: (id: string) => void | Promise<void> }) {
  const [open, setOpen] = useState(false)
  const [recipient, setRecipient] = useState("")
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  // Scoped address book: who this user is actually allowed to message.
  const { data } = useApi<{ contacts: Contact[] }>(open ? "/api/contacts" : null)
  const contacts = data?.contacts ?? []

  const submit = async () => {
    setError("")
    if (!recipient) return setError("Choose someone to message")
    if (!body.trim()) return setError("Write a message")

    setSaving(true)
    try {
      const conv = await apiMutate<{ _id: string }>("/api/conversations", "POST", {
        participantIds: [recipient],
        subject: subject.trim() || undefined,
      })
      await apiMutate(`/api/conversations/${conv._id}/messages`, "POST", { body: body.trim() })
      setOpen(false)
      setRecipient("")
      setSubject("")
      setBody("")
      await onCreated(conv._id)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start the conversation")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New message
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New conversation</DialogTitle>
          <DialogDescription>
            You can message people connected to your courses or children.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>To</Label>
            {contacts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No contacts available yet. Contacts come from your courses and enrolments.
              </p>
            ) : (
              <Select value={recipient} onValueChange={setRecipient}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a recipient" />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.name} — {c.roles?.[0] ?? "user"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject (optional)</Label>
            <Input
              id="subject"
              placeholder="e.g. John's progress in Mathematics"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Message</Label>
            <Textarea
              id="body"
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>

          {error && (
            <p className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving || contacts.length === 0}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending…
              </>
            ) : (
              "Send"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
