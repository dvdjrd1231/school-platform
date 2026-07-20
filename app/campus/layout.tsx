import type React from "react"
import { Inter } from "next/font/google"
import { RoleProvider } from "@/components/context/role-context"
import CampusHeader from "@/components/campus/campus-header"
import CampusNavigation from "@/components/campus/campus-navigation"

const inter = Inter({ subsets: ["latin"] })

export default function CampusLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RoleProvider>
      <div className="min-h-screen bg-gray-50">
        <CampusHeader />
        <CampusNavigation />
        <main className="pt-32">{children}</main>
      </div>
    </RoleProvider>
  )
}
