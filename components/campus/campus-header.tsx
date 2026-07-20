"use client"

import Image from "next/image"
import { Search, User, Mail } from "lucide-react"
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
import { RoleSwitcher } from "@/components/dev/role-switcher"
import { NotificationDropdown } from "@/components/notifications/notification-dropdown"

export { CampusHeader }
export default CampusHeader

function CampusHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <Image
              src="/images/maat-k12-logo.png"
              alt="Maat K12 Campus"
              width={40}
              height={40}
              className="rounded-lg"
            />
            <div>
              <h1 className="text-xl font-bold text-emerald-600">MAAT K12</h1>
              <p className="text-xs text-gray-500">Campus Portal</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input type="search" placeholder="Search campus resources..." className="pl-10 pr-4 py-2 w-full" />
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            <RoleSwitcher />

            <Button variant="ghost" size="sm" className="relative">
              <Mail className="h-5 w-5" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs">2</Badge>
            </Button>

            <NotificationDropdown userId={1} />

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
                    <p className="text-sm font-medium leading-none">Campus User</p>
                    <p className="text-xs leading-none text-muted-foreground">user@maatk12.edu</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile Settings</DropdownMenuItem>
                <DropdownMenuItem>My Studies</DropdownMenuItem>
                <DropdownMenuItem>Account Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Sign Out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}
