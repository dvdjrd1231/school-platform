"use client"

import type React from "react"
import { Suspense } from "react"
import { RoleProvider } from "@/components/context/role-context"
import { ConditionalLayout } from "@/components/layout/conditional-layout"

interface ClientLayoutProps {
  children: React.ReactNode
}

export function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <RoleProvider>
      <div className="min-h-screen bg-background">
        <Suspense fallback={<div>Loading...</div>}>
          <ConditionalLayout>{children}</ConditionalLayout>
        </Suspense>
      </div>
    </RoleProvider>
  )
}
