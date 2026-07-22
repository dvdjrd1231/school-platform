import { User, hashPassword } from "@/lib/models"

/**
 * Ensures the bootstrap administrator described by the ADMIN_USER /
 * ADMIN_PASSWORD environment variables exists in the database.
 *
 * The env vars are the source of truth for this account:
 *   - ADMIN_USER      the admin's login email (must be a valid email address)
 *   - ADMIN_PASSWORD  the admin's password
 *   - ADMIN_NAME      optional display name (default "Administrator")
 *
 * Behaviour:
 *   - account missing  -> created as an active admin
 *   - account exists   -> guarantees it has the "admin" role, and keeps the
 *                         password in sync with ADMIN_PASSWORD
 *
 * This runs at sign-in time (from the Credentials provider), so the operator
 * only has to set the variables in Vercel and redeploy — no seeding step, and
 * nothing a stranger can reach, because the values live in the server
 * environment, not in any public form.
 */
export async function ensureEnvAdmin(): Promise<void> {
  const rawEmail = process.env.ADMIN_USER?.trim().toLowerCase()
  const password = process.env.ADMIN_PASSWORD
  if (!rawEmail || !password) return

  // Login is by email; a non-email ADMIN_USER could never be typed into the
  // sign-in form, so skip rather than create an unreachable account.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
    console.warn("[auth] ADMIN_USER is not a valid email address; skipping admin bootstrap.")
    return
  }

  const name = process.env.ADMIN_NAME?.trim() || "Administrator"

  const existing = await User.findOne({ email: rawEmail }).select("+passwordHash")

  if (!existing) {
    await User.create({
      name,
      email: rawEmail,
      passwordHash: await hashPassword(password),
      roles: ["admin"],
      status: "active",
      department: "Administration",
    })
    return
  }

  let dirty = false

  if (!existing.roles.includes("admin")) {
    existing.roles = Array.from(new Set([...existing.roles, "admin"])) as typeof existing.roles
    dirty = true
  }
  if (existing.status !== "active") {
    existing.status = "active"
    dirty = true
  }
  // Keep the password aligned with the env var. comparePassword avoids an
  // expensive re-hash on every login when nothing changed.
  const matches = await existing.comparePassword(password)
  if (!matches) {
    existing.passwordHash = await hashPassword(password)
    dirty = true
  }

  if (dirty) await existing.save()
}
