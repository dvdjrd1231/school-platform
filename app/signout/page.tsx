"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useRole } from "@/components/context/role-context"

export default function SignOutPage() {
  const router = useRouter()
  const { setRole } = useRole()

  useEffect(() => {
    // Clear the user role
    setRole("student")

    // Redirect to sign in page
    router.push("/signin")
  }, [router, setRole])

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Signing out...</h1>
        <p className="text-gray-600">Please wait while we sign you out.</p>
      </div>
    </div>
  )
}
