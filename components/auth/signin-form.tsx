"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Eye, EyeOff, User, Lock, UserCheck } from "lucide-react"
import { useRole, type UserRole } from "@/components/context/role-context"
import { Checkbox } from "@/components/ui/checkbox"

export function SignInForm() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>(["student"])
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const router = useRouter()
  const { setRoles } = useRole()

  const handleRoleChange = (role: UserRole, checked: boolean) => {
    if (checked) {
      setSelectedRoles((prev) => [...prev.filter((r) => r !== role), role])
    } else {
      setSelectedRoles((prev) => {
        const newRoles = prev.filter((r) => r !== role)
        return newRoles.length > 0 ? newRoles : ["student"]
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Simple authentication check
    if (username === "test" && password === "123456") {
      setRoles(selectedRoles)

      // Redirect based on primary role (first selected role)
      if (selectedRoles.includes("admin")) {
        router.push("/admin")
      } else {
        router.push("/")
      }
    } else {
      setError("Invalid username or password")
    }

    setIsLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label className="text-sm font-medium text-gray-700">Sign in as (select all that apply)</Label>
          <div className="mt-2 space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="student"
                checked={selectedRoles.includes("student")}
                onCheckedChange={(checked) => handleRoleChange("student", checked as boolean)}
              />
              <Label htmlFor="student" className="flex items-center gap-2 cursor-pointer">
                <User className="h-4 w-4" />
                Student
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="teacher"
                checked={selectedRoles.includes("teacher")}
                onCheckedChange={(checked) => handleRoleChange("teacher", checked as boolean)}
              />
              <Label htmlFor="teacher" className="flex items-center gap-2 cursor-pointer">
                <UserCheck className="h-4 w-4" />
                Teacher
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="admin"
                checked={selectedRoles.includes("admin")}
                onCheckedChange={(checked) => handleRoleChange("admin", checked as boolean)}
              />
              <Label htmlFor="admin" className="flex items-center gap-2 cursor-pointer">
                <UserCheck className="h-4 w-4 text-emerald-600" />
                Administrator
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="parent"
                checked={selectedRoles.includes("parent")}
                onCheckedChange={(checked) => handleRoleChange("parent", checked as boolean)}
              />
              <Label htmlFor="parent" className="flex items-center gap-2 cursor-pointer">
                <User className="h-4 w-4 text-blue-600" />
                Parent
              </Label>
            </div>
          </div>
          {selectedRoles.length > 0 && (
            <div className="mt-2 text-xs text-gray-500">Selected: {selectedRoles.join(", ")}</div>
          )}
        </div>

        <div>
          <Label htmlFor="username" className="text-sm font-medium text-gray-700">
            Username
          </Label>
          <div className="relative mt-1">
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="pl-10"
              placeholder="Enter your username"
              required
            />
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
        </div>

        <div>
          <Label htmlFor="password" className="text-sm font-medium text-gray-700">
            Password
          </Label>
          <div className="relative mt-1">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 pr-10"
              placeholder="Enter your password"
              required
            />
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-3">
            <p className="text-sm text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={isLoading}>
        {isLoading ? "Signing in..." : "Sign In"}
      </Button>
    </form>
  )
}
