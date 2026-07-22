/**
 * Diagnostic: verify the configured admin can actually sign in.
 *
 *   pnpm tsx scripts/verify-login.ts
 *
 * Exercises the real sign-in path (ensureEnvAdmin + verifyCredentials) against
 * whatever MONGODB_URI / ADMIN_USER / ADMIN_PASSWORD are configured, so a
 * misconfiguration is reported here instead of as a login failure in the UI.
 */
import "dotenv/config"

import { connectDB, disconnectDB } from "../lib/db/connect"
import { ensureEnvAdmin } from "../lib/auth/ensure-admin"
import { verifyCredentials } from "../lib/auth/verify-credentials"
import { User } from "../lib/models"

async function main() {
  const uri = process.env.MONGODB_URI
  const adminUser = process.env.ADMIN_USER
  const adminPassword = process.env.ADMIN_PASSWORD

  console.log("--- environment ---")
  console.log("MONGODB_URI   :", uri ? uri.replace(/\/\/[^:@/]+:[^@/]+@/, "//***:***@") : "MISSING")
  console.log("AUTH_SECRET   :", process.env.AUTH_SECRET ? "set" : "MISSING")
  console.log("ADMIN_USER    :", adminUser ? JSON.stringify(adminUser) : "MISSING")
  console.log("ADMIN_PASSWORD:", adminPassword ? `set (${adminPassword.length} chars)` : "MISSING")

  await connectDB()
  console.log("\n--- database ---")
  console.log("connected, users:", await User.countDocuments())

  console.log("\n--- admin bootstrap ---")
  try {
    await ensureEnvAdmin()
    console.log("ensureEnvAdmin: ok")
  } catch (err) {
    console.log("ensureEnvAdmin FAILED:", err instanceof Error ? err.message : err)
  }

  if (adminUser && adminPassword) {
    console.log("\n--- sign-in attempt ---")
    const result = await verifyCredentials({ email: adminUser, password: adminPassword })
    if (result) {
      console.log("LOGIN OK ->", result.email, "roles:", result.roles.join(", "))
    } else {
      console.log("LOGIN FAILED for", JSON.stringify(adminUser))
      const found = await User.findOne({ email: adminUser.trim().toLowerCase() })
      console.log(found ? "  (account exists; password did not match)" : "  (no account with that email)")
    }
  }

  await disconnectDB()
}

main().catch((err) => {
  console.error("verify-login failed:", err)
  process.exit(1)
})
