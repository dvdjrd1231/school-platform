"use client"

import { Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useRole, type UserRole } from "@/components/context/role-context"

export function RoleSwitcher() {
  const { currentRoles, setRoles } = useRole()

  // Only show in development - easily removable for production
  if (process.env.NODE_ENV === "production") {
    return null
  }

  const handleRoleToggle = (role: UserRole) => {
    if (currentRoles.includes(role)) {
      // Remove role if it exists (but keep at least one role)
      if (currentRoles.length > 1) {
        setRoles(currentRoles.filter((r) => r !== role))
      }
    } else {
      // Add role if it doesn't exist
      setRoles([...currentRoles, role])
    }
  }

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case "admin":
        return "bg-red-500 hover:bg-red-600"
      case "teacher":
        return "bg-blue-500 hover:bg-blue-600"
      case "student":
        return "bg-green-500 hover:bg-green-600"
      case "parent":
        return "bg-purple-500 hover:bg-purple-600"
      default:
        return "bg-gray-500 hover:bg-gray-600"
    }
  }

  const displayRoles = currentRoles.length === 1 ? currentRoles[0].toUpperCase() : `${currentRoles.length} ROLES`

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Settings className="h-4 w-4 mr-2" />
          <Badge className={`text-xs ${getRoleColor(currentRoles[0])}`}>{displayRoles}</Badge>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48" align="end">
        <DropdownMenuLabel className="text-xs text-muted-foreground">DEV: Toggle Roles</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleRoleToggle("student")}>
          <div className="flex items-center gap-2">
            <Badge className="bg-green-500 hover:bg-green-600 text-xs">
              {currentRoles.includes("student") ? "✓ " : ""}STUDENT
            </Badge>
            <span>Student View</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleRoleToggle("teacher")}>
          <div className="flex items-center gap-2">
            <Badge className="bg-blue-500 hover:bg-blue-600 text-xs">
              {currentRoles.includes("teacher") ? "✓ " : ""}TEACHER
            </Badge>
            <span>Teacher View</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleRoleToggle("admin")}>
          <div className="flex items-center gap-2">
            <Badge className="bg-red-500 hover:bg-red-600 text-xs">
              {currentRoles.includes("admin") ? "✓ " : ""}ADMIN
            </Badge>
            <span>Admin View</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleRoleToggle("parent")}>
          <div className="flex items-center gap-2">
            <Badge className="bg-purple-500 hover:bg-purple-600 text-xs">
              {currentRoles.includes("parent") ? "✓ " : ""}PARENT
            </Badge>
            <span>Parent View</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default RoleSwitcher
