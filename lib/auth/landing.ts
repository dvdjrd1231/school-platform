import type { UserRole } from "@/lib/models/User"

/**
 * The page a user lands on after signing in, chosen by role.
 *
 * A user may hold several roles; the most privileged wins, so an
 * admin-and-teacher lands on the admin dashboard. Students and parents have no
 * dedicated dashboard yet and land on the campus home.
 */
export function landingPathForRoles(roles: UserRole[] | undefined): string {
  const r = roles ?? []
  if (r.includes("admin")) return "/admin"
  if (r.includes("teacher")) return "/instructor"
  return "/"
}
