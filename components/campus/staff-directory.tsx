"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Clock, Mail, MessageSquare, Search } from "lucide-react"

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
  department?: string
  officeHours?: string
  bio?: string
}

function initials(name?: string): string {
  if (!name) return "?"
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("")
}

interface Props {
  title: string
  description: string
  /** Narrow to one role, e.g. only admins for the school office. */
  role?: "teacher" | "admin"
  emptyMessage?: string
}

/**
 * A directory of the staff this person can actually reach.
 *
 * The support and advising pages listed invented counsellors with invented
 * phone numbers, which is worse than useless — someone would try to ring them.
 * This lists real staff from the same scoped address book messaging uses, and
 * starts a real conversation.
 */
export function StaffDirectory({ title, description, role, emptyMessage }: Props) {
  const router = useRouter()
  const { data, error, isLoading, refetch } = useApi<{ contacts: Contact[] }>("/api/contacts")
  const [search, setSearch] = useState("")
  const [starting, setStarting] = useState<string | null>(null)

  const staff = useMemo(() => {
    const all = (data?.contacts ?? []).filter((c) =>
      role ? c.roles?.includes(role) : c.roles?.some((r) => r === "teacher" || r === "admin"),
    )
    const q = search.trim().toLowerCase()
    if (!q) return all
    return all.filter(
      (c) =>
        (c.name ?? "").toLowerCase().includes(q) ||
        (c.subject ?? "").toLowerCase().includes(q) ||
        (c.department ?? "").toLowerCase().includes(q),
    )
  }, [data, role, search])

  const message = async (contact: Contact) => {
    setStarting(contact._id)
    try {
      const conversation = await apiMutate<{ _id: string }>("/api/conversations", "POST", {
        participantIds: [contact._id],
      })
      router.push(`/messages/${conversation._id}`)
    } catch {
      router.push("/messages")
    } finally {
      setStarting(null)
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <h1 className="mb-2 text-3xl font-bold text-gray-900">{title}</h1>
        <p className="text-gray-600">{description}</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search by name, subject or department…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <AsyncState
        isLoading={isLoading}
        error={error}
        isEmpty={staff.length === 0}
        emptyMessage={
          search
            ? "Nobody matches that search."
            : (emptyMessage ??
              "Nobody is linked to your account yet. Once you're enrolled in a class, your teachers appear here.")
        }
        onRetry={refetch}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {staff.map((person) => (
            <Card key={person._id}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    {person.avatar && <AvatarImage src={person.avatar} alt={person.name ?? ""} />}
                    <AvatarFallback>{initials(person.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <CardTitle className="truncate text-base">{person.name ?? "Unknown"}</CardTitle>
                    {(person.subject || person.department) && (
                      <Badge variant="secondary" className="mt-1">
                        {person.subject ?? person.department}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {person.bio && (
                  <p className="line-clamp-3 text-sm text-muted-foreground">{person.bio}</p>
                )}
                <div className="space-y-1 text-sm text-muted-foreground">
                  {person.officeHours && (
                    <p className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {person.officeHours}
                    </p>
                  )}
                  {person.email && (
                    <p className="flex items-center gap-2 truncate">
                      <Mail className="h-4 w-4 shrink-0" />
                      {person.email}
                    </p>
                  )}
                </div>
                <Button
                  className="w-full"
                  disabled={starting === person._id}
                  onClick={() => void message(person)}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Send a message
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </AsyncState>
    </div>
  )
}
