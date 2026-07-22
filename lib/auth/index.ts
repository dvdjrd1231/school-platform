import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"

import { authConfig } from "./config"
import { ensureEnvAdmin } from "./ensure-admin"
import { verifyCredentials } from "./verify-credentials"
import { connectDB } from "@/lib/db/connect"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        await connectDB()

        // Ensure the env-configured bootstrap admin exists before we verify, so
        // ADMIN_USER / ADMIN_PASSWORD can sign in on a fresh database with no
        // seeding step. Wrapped so a bootstrap failure logs the real cause but
        // does not throw out of authorize — an uncaught throw here surfaces to
        // the browser as the opaque "error=Configuration" page and blocks every
        // login, including already-seeded accounts.
        try {
          await ensureEnvAdmin()
        } catch (err) {
          console.error("[auth] ensureEnvAdmin failed:", err)
        }

        return verifyCredentials(raw)
      },
    }),
  ],
})
