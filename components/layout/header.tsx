"use client"

import { Mail, Search, User } from "lucide-react"
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

          {/* Email Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Mail className="h-5 w-5" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs">3</Badge>
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
                  <p className="text-sm font-medium leading-none">John Student</p>
                  <p className="text-xs leading-none text-muted-foreground">john.student@maatk12.edu</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile Settings</DropdownMenuItem>
              <DropdownMenuItem>My Courses</DropdownMenuItem>
              <DropdownMenuItem>Grades</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Sign Out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
