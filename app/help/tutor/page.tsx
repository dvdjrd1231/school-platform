"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Clock, Mail, MessageSquare, Search, User } from "lucide-react"

import { useApi } from "@/hooks/use-api"
import { apiMutate } from "@/lib/api/client"
import { AsyncState } from "@/components/ui/async-state"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

interface Contact {
  _id: string
  name?: string
  email?: string
  avatar?: string
  roles?: string[]
  subject?: string
  officeHours?: string
  bio?: string
}

function initials(name?: string): string {
  if (!name) return "?"
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

/**
 * Tutor — the page behind the Help › Tutor tab, which was blank because the
 * route didn't exist at all.
 *
 * It lists the teachers this person can actually reach (the same contacts the
 * messaging system allows, so it can't be used to find staff you have no
 * relationship with) with their subject and office hours, and starts a
 * conversation in one click.
 */
export default function TutorPage() {
  const router = useRouter()
  const { data, error, isLoading, refetch } = useApi<{ contacts: Contact[] }>("/api/contacts")
  const [search, setSearch] = useState("")
  const [starting, setStarting] = useState<string | null>(null)

  const tutors = useMemo(() => {
    const all = (data?.contacts ?? []).filter(
      (c) => c.roles?.includes("teacher") || c.roles?.includes("admin"),
    )
    const q = search.trim().toLowerCase()
    if (!q) return all
    return all.filter(
      (c) =>
        (c.name ?? "").toLowerCase().includes(q) ||
        (c.subject ?? "").toLowerCase().includes(q),
    )
  }, [data, search])

  const message = async (contact: Contact) => {
    setStarting(contact._id)
    try {
      const conversation = await apiMutate<{ _id: string }>("/api/conversations", "POST", {
        participantIds: [contact._id],
      })
      router.push(`/messages/${conversation._id}`)
    } catch {
      // Falling back to the inbox is better than stranding them on an error:
      // the conversation may already exist under a different id.
      router.push("/messages")
    } finally {
      setStarting(null)
    }
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-emerald-600">Tutor</h1>
        <p className="text-muted-foreground">
          Your teachers and their office hours. Ask a question and it goes straight to them.
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search by name or subject…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <AsyncState
        isLoading={isLoading}
        error={error}
        isEmpty={tutors.length === 0}
        emptyMessage={
          search
            ? "Nobody matches that search."
            : "No teachers are linked to you yet. Once you're enrolled in a class, your teacher appears here."
        }
        onRetry={refetch}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tutors.map((tutor) => (
            <Card key={tutor._id}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    {tutor.avatar && <AvatarImage src={tutor.avatar} alt={tutor.name ?? ""} />}
                    <AvatarFallback>{initials(tutor.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <CardTitle className="truncate text-base">{tutor.name ?? "Unknown"}</CardTitle>
                    {tutor.subject && (
                      <Badge variant="secondary" className="mt-1">
                        {tutor.subject}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {tutor.bio && (
                  <p className="line-clamp-3 text-sm text-muted-foreground">{tutor.bio}</p>
                )}

                <div className="space-y-1 text-sm text-muted-foreground">
                  {tutor.officeHours && (
                    <p className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {tutor.officeHours}
                    </p>
                  )}
                  {tutor.email && (
                    <p className="flex items-center gap-2 truncate">
                      <Mail className="h-4 w-4 shrink-0" />
                      {tutor.email}
                    </p>
                  )}
                  {!tutor.officeHours && (
                    <p className="flex items-center gap-2 text-xs">
                      <User className="h-4 w-4" />
                      No office hours listed
                    </p>
                  )}
                </div>

                <Button
                  className="w-full"
                  disabled={starting === tutor._id}
                  onClick={() => void message(tutor)}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Ask a question
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </AsyncState>
    </div>
  )
}
