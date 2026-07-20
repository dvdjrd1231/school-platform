"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GraduationCap } from "lucide-react"

/**
 * Student self-registration.
 *
 * Creates a student account only — role is fixed server-side in
 * /api/register. Staff and parent accounts are created by an administrator.
 */
export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    gradeLevel: "",
  })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match")
      return
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          gradeLevel: form.gradeLevel || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Registration failed")
        return
      }

      // Sign the new student straight in rather than bouncing them to /signin.
      const result = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      })
      if (result?.error) {
        router.push("/signin")
        return
      }

      router.push("/")
      router.refresh()
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
            <GraduationCap className="h-6 w-6 text-emerald-600" />
          </div>
          <CardTitle className="text-2xl">Create your account</CardTitle>
          <p className="text-sm text-gray-600">Register as a student at Maat K12</p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={form.name} onChange={update("name")} required minLength={2} />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={update("email")}
                required
              />
            </div>

            <div>
              <Label htmlFor="gradeLevel">Grade level (optional)</Label>
              <Input
                id="gradeLevel"
                value={form.gradeLevel}
                onChange={update("gradeLevel")}
                placeholder="e.g. 10th"
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={update("password")}
                required
                minLength={8}
              />
              <p className="mt-1 text-xs text-gray-500">At least 8 characters.</p>
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={update("confirmPassword")}
                required
              />
            </div>

            {error && (
              <p className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-600" role="alert">
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              disabled={isLoading}
            >
              {isLoading ? "Creating account…" : "Create account"}
            </Button>

            <p className="text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/signin" className="font-medium text-emerald-600 hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
