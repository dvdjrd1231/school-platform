"use client"

import { createContext, useContext, useMemo, useState, type ReactNode } from "react"
import { useSession } from "next-auth/react"

export type UserRole = "student" | "teacher" | "admin" | "parent"

interface RoleContextType {
  currentRoles: UserRole[]
  /** The active role, used for views that render one role at a time. */
  currentRole: UserRole
  primaryRole: UserRole
  userId: string | null
  userName: string | null
  isLoading: boolean
  setRole: (role: UserRole) => void
  setRoles: (roles: UserRole[]) => void
  hasRole: (role: UserRole) => boolean
  isAdmin: boolean
  isTeacher: boolean
  isStudent: boolean
  isParent: boolean
}

const RoleContext = createContext<RoleContextType | undefined>(undefined)

/**
 * Roles now come from the authenticated session rather than local state, so a
 * user cannot grant themselves a role by clicking around. `setRole` only
 * switches which of the roles they already hold is active — it cannot add one.
 *
 * The API surface is unchanged from the previous mock implementation so the
 * existing components continue to work.
 */
export function RoleProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()
  const [activeRole, setActiveRole] = useState<UserRole | null>(null)

  const value = useMemo<RoleContextType>(() => {
    const sessionRoles = (session?.user?.roles as UserRole[] | undefined) ?? []
    const currentRoles: UserRole[] = sessionRoles.length > 0 ? sessionRoles : ["student"]

    // Only honour an active-role override if the user actually holds that role.
    const currentRole =
      activeRole && currentRoles.includes(activeRole) ? activeRole : currentRoles[0]

    return {
      currentRoles,
      currentRole,
      primaryRole: currentRole,
      userId: session?.user?.id ?? null,
      userName: session?.user?.name ?? null,
      isLoading: status === "loading",
      setRole: (role) => setActiveRole(role),
      setRoles: (roles) => setActiveRole(roles[0] ?? null),
      hasRole: (role) => currentRoles.includes(role),
      isAdmin: currentRoles.includes("admin"),
      isTeacher: currentRoles.includes("teacher"),
      isStudent: currentRoles.includes("student"),
      isParent: currentRoles.includes("parent"),
    }
  }, [session, status, activeRole])

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>
}

export function useRole() {
  const context = useContext(RoleContext)
  if (context === undefined) {
    throw new Error("useRole must be used within a RoleProvider")
  }
  return context
}
