import { z } from "zod"

import { connectDB } from "@/lib/db/connect"
import { User } from "@/lib/models"
import type { UserRole } from "@/lib/models/User"

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export interface AuthedUser {
  id: string
  name: string
  email: string
  image: string | null
  roles: UserRole[]
}

/**
 * Verify an email/password pair against the database.
 *
 * Extracted from the NextAuth Credentials provider so the matching logic can be
 * unit-tested directly against a real database, independent of NextAuth.
 *
 * Returns the authenticated user on success, or null for EVERY failure mode
 * (bad input, unknown email, wrong password, inactive account) — the caller
 * must not be able to tell these apart, or an attacker could enumerate which
 * emails have accounts.
 */
export async function verifyCredentials(raw: unknown): Promise<AuthedUser | null> {
  const parsed = credentialsSchema.safeParse(raw)
  if (!parsed.success) return null

  const { email, password } = parsed.data
  await connectDB()

  // passwordHash is select:false on the schema, so request it explicitly.
  const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash")
  if (!user || user.status !== "active") return null

  const valid = await user.comparePassword(password)
  if (!valid) return null

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    image: user.avatar ?? null,
    // Must be plain, structured-cloneable values. Mongoose hands back a
    // CoreDocumentArray (an Array subclass) here, and `jose` calls
    // structuredClone when encoding the session JWT — which throws
    // "DataCloneError: [object Array] could not be cloned" and surfaces to the
    // browser as an opaque error=Configuration page. Copy to a plain array of
    // plain strings so the token can be serialised.
    roles: user.roles.map((role) => String(role) as UserRole),
  }
}
