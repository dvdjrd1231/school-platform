import NextAuth from "next-auth"
import { NextResponse } from "next/server"
import { authConfig } from "@/lib/auth/config"

// Edge-safe instance: no database, no Mongoose. See lib/auth/config.ts.
const { auth } = NextAuth(authConfig)

/** Route prefixes that require specific roles. First match wins. */
const ROLE_PROTECTED: { prefix: string; roles: string[] }[] = [
  { prefix: "/admin", roles: ["admin"] },
  { prefix: "/instructor", roles: ["teacher", "admin"] },
]

/** Routes reachable without a session. Everything else requires sign-in. */
const PUBLIC_ROUTES = ["/signin", "/register", "/api/auth", "/api/register"]

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  if (PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) {
    // Already signed in? Don't show the sign-in page again.
    if (session && (pathname === "/signin" || pathname === "/register")) {
      return NextResponse.redirect(new URL("/", req.nextUrl))
    }
    return NextResponse.next()
  }

  if (!session?.user) {
    // API callers get a 401 rather than an HTML redirect they can't parse.
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const signInUrl = new URL("/signin", req.nextUrl)
    signInUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(signInUrl)
  }

  const roles = session.user.roles ?? []
  const rule = ROLE_PROTECTED.find((r) => pathname.startsWith(r.prefix))
  if (rule && !rule.roles.some((role) => roles.includes(role as never))) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    return NextResponse.redirect(new URL("/", req.nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  // Skip static assets and image optimisation; match everything else.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
