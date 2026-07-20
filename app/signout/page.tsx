"use client"

import { useEffect, useRef } from "react"
import { signOut } from "next-auth/react"

/**
 * Signs the user out and returns them to the sign-in page.
 *
 * This must call NextAuth's signOut() to clear the session cookie. Clearing
 * local role state alone leaves the session valid, so the middleware would
 * simply redirect the user straight back into the app.
 */
export default function SignOutPage() {
  // React 18+ runs effects twice in development; without this guard signOut()
  // fires twice and the second call races the redirect.
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    void signOut({ callbackUrl: "/signin" })
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 to-emerald-100">
      <div className="text-center">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">Signing out…</h1>
        <p className="text-gray-600">Please wait while we sign you out.</p>
      </div>
    </div>
  )
}
