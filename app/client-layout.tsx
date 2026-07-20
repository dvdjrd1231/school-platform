"use client"

import type React from "react"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Header } from "@/components/layout/header"
import { Navigation } from "@/components/layout/navigation"
import { Suspense } from "react"
import { RoleProvider } from "@/components/context/role-context"
import { CampusHeader } from "@/components/campus/campus-header"
import { CampusNavigation } from "@/components/campus/campus-navigation"
import { usePathname } from "next/navigation"
import { ConditionalLayout } from "@/components/layout/conditional-layout"

function CampusConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isCampusRoute = pathname === "/" || pathname.startsWith("/campus")

  if (isCampusRoute) {
    return (
      <>
        <CampusHeader />
        <CampusNavigation />
        <main className="flex">{children}</main>
      </>
    )
  }

  return (
    <>
      <Header />
      <Navigation />
      <main className="flex">{children}</main>
    </>
  )
}

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <RoleProvider>
          <div className="min-h-screen bg-background">
            <Suspense fallback={<div>Loading...</div>}>
              <ConditionalLayout>{children}</ConditionalLayout>
            </Suspense>
          </div>
        </RoleProvider>
        <Analytics />
      </body>
    </html>
  )
}
