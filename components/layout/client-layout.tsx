"use client"

import type React from "react"
import { Suspense } from "react"
import { SessionProvider } from "next-auth/react"

import { CourseProvider } from "@/components/context/course-context"
import { RoleProvider } from "@/components/context/role-context"
import { ConditionalLayout } from "@/components/layout/conditional-layout"

interface ClientLayoutProps {
  children: React.ReactNode
}

export function ClientLayout({ children }: ClientLayoutProps) {
  return (
    // SessionProvider must wrap RoleProvider: roles are derived from the session.
    <SessionProvider>
      <RoleProvider>
        {/* CourseProvider sits inside RoleProvider: it only fetches once a user
            is known, so the auth screens don't fire a doomed request. */}
        <CourseProvider>
          <div className="min-h-screen bg-background">
            <Suspense fallback={<div>Loading...</div>}>
              <ConditionalLayout>{children}</ConditionalLayout>
            </Suspense>
          </div>
        </CourseProvider>
      </RoleProvider>
    </SessionProvider>
  )
}
