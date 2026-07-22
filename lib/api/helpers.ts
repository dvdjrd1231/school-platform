import { NextResponse } from "next/server"
import { ZodError, type ZodSchema } from "zod"
import mongoose from "mongoose"

import { auth } from "@/lib/auth"
import { connectDB, redactUri } from "@/lib/db/connect"
import type { UserRole } from "@/lib/models/User"

export interface SessionUser {
  id: string
  name?: string | null
  email?: string | null
  roles: UserRole[]
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

/**
 * Resolve the current session, connecting to MongoDB along the way.
 * Throws ApiError(401) when unauthenticated.
 */
export async function requireUser(): Promise<SessionUser> {
  const session = await auth()
  if (!session?.user?.id) throw new ApiError(401, "Unauthorized")
  await connectDB()
  return session.user as SessionUser
}

/** Require the caller to hold at least one of `roles`. */
export async function requireRole(...roles: UserRole[]): Promise<SessionUser> {
  const user = await requireUser()
  if (!roles.some((r) => user.roles.includes(r))) {
    throw new ApiError(403, `Requires role: ${roles.join(" or ")}`)
  }
  return user
}

export function hasRole(user: SessionUser, ...roles: UserRole[]): boolean {
  return roles.some((r) => user.roles.includes(r))
}

/** Parse and validate a JSON request body. Throws ApiError(400) on mismatch. */
export async function parseBody<T>(req: Request, schema: ZodSchema<T>): Promise<T> {
  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    throw new ApiError(400, "Request body must be valid JSON")
  }
  const result = schema.safeParse(raw)
  if (!result.success) {
    throw new ApiError(400, formatZodError(result.error))
  }
  return result.data
}

function formatZodError(error: ZodError): string {
  return error.issues.map((i) => `${i.path.join(".") || "body"}: ${i.message}`).join("; ")
}

export function assertObjectId(id: string, label = "id"): string {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `Invalid ${label}`)
  }
  return id
}

/**
 * Wrap a route handler so thrown errors become proper HTTP responses instead of
 * unhandled 500s with stack traces in the response body.
 */
export function handleErrors(err: unknown): NextResponse {
  if (err instanceof ApiError) {
    return NextResponse.json({ error: err.message }, { status: err.status })
  }
  if (err instanceof ZodError) {
    return NextResponse.json({ error: formatZodError(err) }, { status: 400 })
  }
  if (err instanceof mongoose.Error.ValidationError) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
  // Duplicate key — e.g. registering an email that already exists.
  if (typeof err === "object" && err !== null && (err as { code?: number }).code === 11000) {
    return NextResponse.json({ error: "That record already exists" }, { status: 409 })
  }

  // Deployment/configuration faults are reported explicitly rather than as a
  // generic 500. They contain no user data, and "Internal server error" gives
  // an operator nothing to act on. Credentials are redacted first.
  if (isConfigurationError(err)) {
    const detail = redactUri(err instanceof Error ? err.message : String(err))
    console.error("[api] Configuration error:", detail)
    return NextResponse.json(
      { error: `Server is not configured correctly: ${detail}`, hint: "GET /api/health" },
      { status: 503 },
    )
  }

  console.error("[api] Unhandled error:", err)
  return NextResponse.json({ error: "Internal server error" }, { status: 500 })
}

function isConfigurationError(err: unknown): boolean {
  if (err instanceof mongoose.Error.MongooseServerSelectionError) return true
  if (!(err instanceof Error)) return false
  return (
    err.message.includes("No MongoDB connection string") ||
    err.message.includes("MONGODB_URI") ||
    // Auth.js throws this when AUTH_SECRET is absent.
    err.name === "MissingSecret"
  )
}

export function json<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status })
}
