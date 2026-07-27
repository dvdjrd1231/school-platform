"use client"

import { useEffect, useState } from "react"
import { Award, BookOpen, Loader2, Mail, MapPin, Phone, Plus, Trash2, User as UserIcon } from "lucide-react"

import { useApi } from "@/hooks/use-api"
import { apiMutate } from "@/lib/api/client"
import { useRole } from "@/components/context/role-context"
import { AvatarUploader } from "@/components/profile/avatar-uploader"
import { AsyncState } from "@/components/ui/async-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

interface GuardianContact {
  name: string
  relationship?: string
  phone?: string
  email?: string
  isEmergencyContact?: boolean
}

interface ProfileUser {
  _id: string
  name: string
  email: string
  roles: string[]
  status: string
  avatar?: string
  phone?: string
  bio?: string
  officeHours?: string
  subject?: string
  department?: string
  studentId?: string
  gradeLevel?: string
  enrollmentDate?: string
  dateOfBirth?: string
  address?: {
    line1?: string
    line2?: string
    city?: string
    state?: string
    postalCode?: string
    country?: string
  }
  guardianContacts?: GuardianContact[]
  children?: { _id: string; name?: string; email?: string }[]
}

const EMPTY_GUARDIAN: GuardianContact = {
  name: "",
  relationship: "",
  phone: "",
  email: "",
  isEmergencyContact: false,
}

/**
 * Your own profile: photo, contact details, and — for a student — the parent
 * and emergency contacts held on the record.
 *
 * Everything here was sample text for one fictional student. It now reads and
 * writes the signed-in user's real record.
 */
export default function ProfilePage() {
  const { userId } = useRole()
  const { data, error, isLoading, refetch } = useApi<ProfileUser>(
    userId ? `/api/users/${userId}` : null,
  )

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    bio: "",
    officeHours: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
  })
  const [guardians, setGuardians] = useState<GuardianContact[]>([])
  const [avatar, setAvatar] = useState("")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState("")

  useEffect(() => {
    if (!data) return
    setForm({
      name: data.name,
      email: data.email,
      phone: data.phone ?? "",
      bio: data.bio ?? "",
      officeHours: data.officeHours ?? "",
      line1: data.address?.line1 ?? "",
      line2: data.address?.line2 ?? "",
      city: data.address?.city ?? "",
      state: data.address?.state ?? "",
      postalCode: data.address?.postalCode ?? "",
      country: data.address?.country ?? "",
    })
    setGuardians(data.guardianContacts ?? [])
    setAvatar(data.avatar ?? "")
  }, [data])

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
    setSaved(false)
  }

  const setGuardian = (index: number, patch: Partial<GuardianContact>) => {
    setGuardians((list) => list.map((g, i) => (i === index ? { ...g, ...patch } : g)))
    setSaved(false)
  }

  const save = async () => {
    if (!userId) return
    setSaving(true)
    setSaveError("")
    try {
      await apiMutate(`/api/users/${userId}`, "PATCH", {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        bio: form.bio.trim() || undefined,
        officeHours: form.officeHours.trim() || undefined,
        address: {
          line1: form.line1.trim() || undefined,
          line2: form.line2.trim() || undefined,
          city: form.city.trim() || undefined,
          state: form.state.trim() || undefined,
          postalCode: form.postalCode.trim() || undefined,
          country: form.country.trim() || undefined,
        },
        // Drop half-filled rows: a contact with no name isn't a contact.
        guardianContacts: guardians
          .filter((g) => g.name.trim())
          .map((g) => ({
            name: g.name.trim(),
            relationship: g.relationship?.trim() || undefined,
            phone: g.phone?.trim() || undefined,
            email: g.email?.trim() || undefined,
            isEmergencyContact: g.isEmergencyContact ?? false,
          })),
      })
      setSaved(true)
      await refetch()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not save your profile")
    } finally {
      setSaving(false)
    }
  }

  const isStudent = data?.roles.includes("student") ?? false
  const isTeacher = data?.roles.includes("teacher") ?? false

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-emerald-600">My profile</h1>
        <p className="text-muted-foreground">Your details, photo and contacts</p>
      </div>

      <AsyncState isLoading={isLoading} error={error} onRetry={refetch}>
        {data && (
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardContent className="flex flex-col items-center gap-4 pt-6">
                <AvatarUploader
                  userId={data._id}
                  name={data.name}
                  avatar={avatar}
                  onChange={setAvatar}
                />

                <div className="text-center">
                  <h2 className="text-xl font-semibold">{data.name}</h2>
                  <p className="text-sm text-muted-foreground">{data.email}</p>
                  <div className="mt-2 flex flex-wrap justify-center gap-1">
                    {data.roles.map((role) => (
                      <Badge key={role} variant="secondary" className="capitalize">
                        {role}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="w-full space-y-2 border-t pt-4 text-sm">
                  {data.studentId && (
                    <p className="flex items-center gap-2">
                      <UserIcon className="h-4 w-4 text-muted-foreground" />
                      {data.studentId}
                    </p>
                  )}
                  {data.gradeLevel && (
                    <p className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      {data.gradeLevel}
                    </p>
                  )}
                  {data.subject && (
                    <p className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-muted-foreground" />
                      {data.subject}
                    </p>
                  )}
                  {data.phone && (
                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      {data.phone}
                    </p>
                  )}
                  {data.address?.city && (
                    <p className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {[data.address.city, data.address.state].filter(Boolean).join(", ")}
                    </p>
                  )}
                  {data.enrollmentDate && (
                    <p className="text-xs text-muted-foreground">
                      Enrolled{" "}
                      {new Date(data.enrollmentDate).toLocaleDateString(undefined, {
                        dateStyle: "medium",
                      })}
                    </p>
                  )}
                </div>

                {(data.children?.length ?? 0) > 0 && (
                  <div className="w-full border-t pt-4">
                    <p className="mb-2 text-sm font-medium">Linked students</p>
                    {data.children?.map((child) => (
                      <p key={child._id} className="text-sm text-muted-foreground">
                        {child.name}
                      </p>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="lg:col-span-2">
              <Tabs defaultValue="details">
                <TabsList>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="address">Address</TabsTrigger>
                  {isStudent && <TabsTrigger value="contacts">Parents &amp; contacts</TabsTrigger>}
                </TabsList>

                <TabsContent value="details" className="pt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Your details</CardTitle>
                      <CardDescription>
                        Changing your email changes how you sign in.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Full name</Label>
                          <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>Email</Label>
                          <Input
                            type="email"
                            value={form.email}
                            onChange={(e) => set("email", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Phone</Label>
                          <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
                        </div>
                        {isTeacher && (
                          <div className="space-y-2">
                            <Label>Office hours</Label>
                            <Input
                              value={form.officeHours}
                              onChange={(e) => set("officeHours", e.target.value)}
                              placeholder="Tue & Thu, 3–4pm"
                            />
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>About</Label>
                        <Textarea
                          rows={4}
                          value={form.bio}
                          onChange={(e) => set("bio", e.target.value)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="address" className="pt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Home address</CardTitle>
                      <CardDescription>Used for school correspondence.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2 sm:col-span-2">
                        <Label>Address line 1</Label>
                        <Input value={form.line1} onChange={(e) => set("line1", e.target.value)} />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label>Address line 2</Label>
                        <Input value={form.line2} onChange={(e) => set("line2", e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>City</Label>
                        <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>State / county</Label>
                        <Input value={form.state} onChange={(e) => set("state", e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Postcode / ZIP</Label>
                        <Input
                          value={form.postalCode}
                          onChange={(e) => set("postalCode", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Country</Label>
                        <Input value={form.country} onChange={(e) => set("country", e.target.value)} />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {isStudent && (
                  <TabsContent value="contacts" className="pt-4">
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <CardTitle className="text-base">Parents and emergency contacts</CardTitle>
                            <CardDescription>
                              Who the school should contact. Only staff and this account can see
                              these.
                            </CardDescription>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setGuardians((g) => [...g, { ...EMPTY_GUARDIAN }])}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Add contact
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {guardians.length === 0 && (
                          <p className="text-sm text-muted-foreground">
                            No contacts recorded yet.
                          </p>
                        )}

                        {guardians.map((guardian, index) => (
                          <div key={index} className="space-y-3 rounded-md border p-3">
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div className="space-y-2">
                                <Label>Name</Label>
                                <Input
                                  value={guardian.name}
                                  onChange={(e) => setGuardian(index, { name: e.target.value })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Relationship</Label>
                                <Input
                                  value={guardian.relationship ?? ""}
                                  placeholder="Mother, Father, Guardian…"
                                  onChange={(e) =>
                                    setGuardian(index, { relationship: e.target.value })
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Phone</Label>
                                <Input
                                  value={guardian.phone ?? ""}
                                  onChange={(e) => setGuardian(index, { phone: e.target.value })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Email</Label>
                                <Input
                                  type="email"
                                  value={guardian.email ?? ""}
                                  onChange={(e) => setGuardian(index, { email: e.target.value })}
                                />
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <label className="flex items-center gap-2 text-sm">
                                <input
                                  type="checkbox"
                                  checked={guardian.isEmergencyContact ?? false}
                                  onChange={(e) =>
                                    setGuardian(index, { isEmergencyContact: e.target.checked })
                                  }
                                />
                                Emergency contact
                              </label>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600"
                                onClick={() =>
                                  setGuardians((list) => list.filter((_, i) => i !== index))
                                }
                              >
                                <Trash2 className="mr-1 h-3.5 w-3.5" />
                                Remove
                              </Button>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </TabsContent>
                )}
              </Tabs>

              <div className="mt-4 flex items-center gap-3">
                <Button onClick={() => void save()} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save changes
                </Button>
                {saved && <span className="text-sm text-green-700">Saved.</span>}
                {saveError && <span className="text-sm text-red-600">{saveError}</span>}
              </div>
            </div>
          </div>
        )}
      </AsyncState>
    </div>
  )
}
