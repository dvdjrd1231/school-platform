"use client"

import { Mail, Search, User } from "lucide-react"
import { signOut, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { RoleSwitcher } from "@/components/dev/role-switcher"
import { NotificationDropdown } from "@/components/notifications/notification-dropdown"

export function Header() {
  const router = useRouter()
  const { data: session } = useSession()
  const user = session?.user

  /**
   * Clears the session cookie and returns to the sign-in page. This must go
   * through NextAuth's signOut — simply navigating to /signin would leave the
   * session valid and the middleware would send the user straight back in.
   */
  const handleSignOut = () => {
    void signOut({ callbackUrl: "/signin" })
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo and School Name */}
        <div className="flex items-center gap-3">
          <Image src="/images/maat-k12-logo.png" alt="Maat K12 Logo" width={40} height={40} className="rounded-lg" />
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-primary">MAAT K12</h1>
            <p className="text-xs text-muted-foreground">Private School</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search courses, assignments..." className="pl-10" />
          </div>
        </div>

        {/* Right Side - Notifications and Profile */}
        <div className="flex items-center gap-4">
          <RoleSwitcher />

          {/* Messages */}
          <Button variant="ghost" size="icon" className="relative" onClick={() => router.push("/messages")}>
            <Mail className="h-5 w-5" />
            <span className="sr-only">Messages</span>
          </Button>

          {/* Notification Dropdown */}
          <NotificationDropdown userId={1} />

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="/diverse-student-profiles.png" alt="Profile" />
                  <AvatarFallback>
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.name ?? "Signed in"}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email ?? ""}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/profile")}>Profile Settings</DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/courses")}>My Courses</DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/grades")}>Grades</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>Sign Out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
