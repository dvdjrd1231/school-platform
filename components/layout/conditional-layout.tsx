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

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
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
