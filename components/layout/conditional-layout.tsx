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

  // A single centered container is the source of truth for page width. It was
  // previously `flex`, which collapsed each page to its content width and stuck
  // it to the left (the empty right-hand gap). `mx-auto` + a max width centers
  // every page on large screens; `w-full` keeps it responsive on small ones.
  const mainClass = "mx-auto w-full max-w-[1400px]"

  if (isCampusRoute) {
    return (
      <>
        <CampusHeader />
        <CampusNavigation />
        <main className={mainClass}>{children}</main>
      </>
    )
  }

  return (
    <>
      <Header />
      <Navigation />
      <main className={mainClass}>{children}</main>
    </>
  )
}
