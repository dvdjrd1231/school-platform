import type { NextAuthConfig } from "next-auth"
import type { UserRole } from "@/lib/models/User"

/**
 * Auth configuration that is safe to run in the Edge runtime (middleware).
 *
 * Middleware runs on Edge, where Mongoose cannot run. This file therefore holds
 * no database access — the Credentials provider that needs Mongo lives in
 * `lib/auth/index.ts`, which is Node-only. This split is what makes
 * `middleware.ts` work at all.
 */
export const authConfig = {
  // Vercel serves each git branch and preview from its own *.vercel.app host.
  // NextAuth v5 rejects requests from hosts it doesn't recognise (an
  // UntrustedHost error, which surfaces as the generic "Configuration" error
  // page). Trusting the host lets auth work on preview URLs as well as the
  // production domain, without hard-coding a single URL.
  trustHost: true,
  pages: {
    signIn: "/signin",
  },
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = String(user.id)
        // Everything placed on the token must survive structuredClone during
        // JWT encoding, so normalise to plain strings rather than trusting the
        // shape handed in (a Mongoose array here breaks encoding entirely).
        const roles = (user as { roles?: UserRole[] }).roles
        token.roles = Array.isArray(roles) && roles.length > 0
          ? roles.map((role) => String(role) as UserRole)
          : (["student"] as UserRole[])
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.roles = (token.roles as UserRole[]) ?? ["student"]
      }
      return session
    },
  },
  providers: [], // Populated in lib/auth/index.ts (Node runtime only).
} satisfies NextAuthConfig

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      roles: UserRole[]
    }
  }
  interface User {
    roles?: UserRole[]
  }
}
