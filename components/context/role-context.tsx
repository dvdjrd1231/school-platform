"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

export type UserRole = "student" | "teacher" | "admin" | "parent"

interface RoleContextType {
  currentRoles: UserRole[]
  setRoles: (roles: UserRole[]) => void
  addRole: (role: UserRole) => void
  removeRole: (role: UserRole) => void
  hasRole: (role: UserRole) => boolean
  isAdmin: boolean
  isTeacher: boolean
  isStudent: boolean
  isParent: boolean
  primaryRole: UserRole
}

const RoleContext = createContext<RoleContextType | undefined>(undefined)

export function RoleProvider({ children }: { children: ReactNode }) {
  const [currentRoles, setCurrentRoles] = useState<UserRole[]>(["student"])

  const setRoles = (roles: UserRole[]) => {
    setCurrentRoles(roles.length > 0 ? roles : ["student"])
  }

  const addRole = (role: UserRole) => {
    if (!currentRoles.includes(role)) {
      setCurrentRoles([...currentRoles, role])
    }
  }

  const removeRole = (role: UserRole) => {
    const newRoles = currentRoles.filter((r) => r !== role)
    setCurrentRoles(newRoles.length > 0 ? newRoles : ["student"])
  }

  const hasRole = (role: UserRole) => currentRoles.includes(role)

  const value = {
    currentRoles,
    setRoles,
    addRole,
    removeRole,
    hasRole,
    isAdmin: currentRoles.includes("admin"),
    isTeacher: currentRoles.includes("teacher"),
    isStudent: currentRoles.includes("student"),
    isParent: currentRoles.includes("parent"),
    primaryRole: currentRoles[0] || "student", // First role is considered primary
  }

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>
}

export function useRole() {
  const context = useContext(RoleContext)
  if (context === undefined) {
    throw new Error("useRole must be used within a RoleProvider")
  }
  return context
}
