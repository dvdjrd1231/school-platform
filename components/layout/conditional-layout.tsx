"use client"

import type React from "react"

import { usePathname } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Navigation } from "@/components/layout/navigation"
import { CampusHeader } from "@/components/campus/campus-header"
import { CampusNavigation } from "@/components/campus/campus-navigation"

interface ConditionalLayoutProps {
  children: React.ReactNode
}

/**
 * Authentication routes render standalone — no header, no navigation, no
 * surrounding <main>. Showing the app chrome to a signed-out visitor exposes
 * navigation they cannot use and notification badges that aren't theirs, and
 * the flex <main> below squeezes a centred auth card into a narrow column.
 */
const AUTH_ROUTES = ["/signin", "/register", "/signout"]

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname()

  if (AUTH_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
    return <>{children}</>
  }

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
