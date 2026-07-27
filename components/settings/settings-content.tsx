"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { KeyRound, Loader2, LogOut, Moon, Sun, User } from "lucide-react"
import { useTheme } from "next-themes"

import { apiMutate } from "@/lib/api/client"
import { useRole } from "@/components/context/role-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

/**
 * Settings: the things that genuinely belong to an account rather than a
 * profile — your password, and how the app looks.
 *
 * Name, email, photo and contact details live on the profile page; duplicating
 * them here would give two places to edit the same record.
 */
export function SettingsContent() {
  const router = useRouter()
  const { userId, userName, currentRoles } = useRole()
  const { theme, setTheme } = useTheme()

  const [passwords, setPasswords] = useState({ next: "", confirm: "" })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const changePassword = async () => {
    setError("")
    setMessage("")

    if (passwords.next.length < 8) return setError("Your new password must be at least 8 characters")
    if (passwords.next !== passwords.confirm) return setError("The two passwords don't match")
    if (!userId) return setError("You need to be signed in")

    setSaving(true)
    try {
      await apiMutate(`/api/users/${userId}`, "PATCH", { password: passwords.next })
      setPasswords({ next: "", confirm: "" })
      setMessage("Password changed. It applies the next time you sign in.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not change your password")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-emerald-600">Settings</h1>
        <p className="text-muted-foreground">
          Signed in as {userName ?? "you"} ({currentRoles.join(", ")})
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-5 w-5" />
            Your profile
          </CardTitle>
          <CardDescription>
            Name, email, photo and contact details are all on your profile.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => router.push("/profile")}>
            Open my profile
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="h-5 w-5" />
            Change password
          </CardTitle>
          <CardDescription>At least 8 characters.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>New password</Label>
            <Input
              type="password"
              value={passwords.next}
              onChange={(e) => setPasswords((p) => ({ ...p, next: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Confirm new password</Label>
            <Input
              type="password"
              value={passwords.confirm}
              onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {message && <p className="text-sm text-green-700">{message}</p>}

          <Button onClick={() => void changePassword()} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Change password
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            {theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            Appearance
          </CardTitle>
          <CardDescription>How the platform looks on this device.</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={theme ?? "system"} onValueChange={setTheme}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="system">Match my device</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <LogOut className="h-5 w-5" />
            Sign out
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => router.push("/signout")}>
            Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
