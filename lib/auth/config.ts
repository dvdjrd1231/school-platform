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
  pages: {
    signIn: "/signin",
  },
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string
        token.roles = (user as { roles?: UserRole[] }).roles ?? ["student"]
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
