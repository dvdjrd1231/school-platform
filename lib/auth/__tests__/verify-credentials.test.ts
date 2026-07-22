import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"
import { MongoMemoryServer } from "mongodb-memory-server"

import { connectDB, disconnectDB } from "@/lib/db/connect"
import { User, hashPassword } from "@/lib/models"
import { verifyCredentials } from "../verify-credentials"
import { ensureEnvAdmin } from "../ensure-admin"

// Spins up a real MongoDB in memory and exercises the actual sign-in matching
// logic end to end: hashed password storage, email lookup, and bcrypt compare.
// This is the path that runs when a user submits the sign-in form.

let mongod: MongoMemoryServer

beforeAll(async () => {
  mongod = await MongoMemoryServer.create()
  process.env.MONGODB_URI = mongod.getUri()
  await connectDB()
}, 60_000)

afterAll(async () => {
  await disconnectDB()
  await mongod.stop()
})

beforeEach(async () => {
  await User.deleteMany({})
  delete process.env.ADMIN_USER
  delete process.env.ADMIN_PASSWORD
})

describe("verifyCredentials", () => {
  async function createUser(email: string, password: string, status: "active" | "inactive" = "active") {
    await User.create({
      name: "Test User",
      email: email.toLowerCase(),
      passwordHash: await hashPassword(password),
      roles: ["student"],
      status,
    })
  }

  it("returns the user when email and password match", async () => {
    await createUser("jane@maatk12.edu", "correct-horse-battery")

    const result = await verifyCredentials({ email: "jane@maatk12.edu", password: "correct-horse-battery" })

    expect(result).not.toBeNull()
    expect(result?.email).toBe("jane@maatk12.edu")
    expect(result?.roles).toContain("student")
    // The password hash must never be part of what a successful login returns.
    expect(result).not.toHaveProperty("passwordHash")
  })

  it("returns a structured-cloneable result so the session JWT can encode", async () => {
    // Regression: Mongoose returns roles as a CoreDocumentArray (an Array
    // subclass). jose calls structuredClone when encoding the JWT, which throws
    // "DataCloneError: [object Array] could not be cloned" on that type and
    // breaks every login with an opaque error=Configuration page.
    await createUser("jane@maatk12.edu", "correct-horse-battery")

    const result = await verifyCredentials({
      email: "jane@maatk12.edu",
      password: "correct-horse-battery",
    })

    expect(result).not.toBeNull()
    expect(() => structuredClone(result)).not.toThrow()
    // A plain array, not a subclass masquerading as one.
    expect(Object.getPrototypeOf(result!.roles)).toBe(Array.prototype)
    expect(result!.roles.every((r) => typeof r === "string")).toBe(true)
  })

  it("rejects a wrong password", async () => {
    await createUser("jane@maatk12.edu", "correct-horse-battery")
    expect(await verifyCredentials({ email: "jane@maatk12.edu", password: "wrong" })).toBeNull()
  })

  it("rejects an unknown email", async () => {
    expect(await verifyCredentials({ email: "nobody@maatk12.edu", password: "whatever123" })).toBeNull()
  })

  it("matches email case-insensitively", async () => {
    await createUser("jane@maatk12.edu", "correct-horse-battery")
    const result = await verifyCredentials({ email: "JANE@MAATK12.EDU", password: "correct-horse-battery" })
    expect(result?.email).toBe("jane@maatk12.edu")
  })

  it("rejects an inactive account even with the right password", async () => {
    await createUser("suspended@maatk12.edu", "correct-horse-battery", "inactive")
    expect(
      await verifyCredentials({ email: "suspended@maatk12.edu", password: "correct-horse-battery" }),
    ).toBeNull()
  })

  it("rejects malformed input without throwing", async () => {
    expect(await verifyCredentials({ email: "not-an-email", password: "x" })).toBeNull()
    expect(await verifyCredentials({})).toBeNull()
    expect(await verifyCredentials(null)).toBeNull()
  })
})

describe("ensureEnvAdmin + verifyCredentials (bootstrap admin login)", () => {
  it("creates the env admin so it can then sign in", async () => {
    process.env.ADMIN_USER = "admin@maatk12.edu"
    process.env.ADMIN_PASSWORD = "super-secret-admin-pw"

    // No admin exists yet.
    expect(await User.findOne({ email: "admin@maatk12.edu" })).toBeNull()

    await ensureEnvAdmin()

    const result = await verifyCredentials({
      email: "admin@maatk12.edu",
      password: "super-secret-admin-pw",
    })
    expect(result).not.toBeNull()
    expect(result?.roles).toContain("admin")
  })

  it("keeps the admin password in sync when ADMIN_PASSWORD changes", async () => {
    process.env.ADMIN_USER = "admin@maatk12.edu"
    process.env.ADMIN_PASSWORD = "first-password"
    await ensureEnvAdmin()

    // Operator rotates the password via the env var.
    process.env.ADMIN_PASSWORD = "second-password"
    await ensureEnvAdmin()

    expect(await verifyCredentials({ email: "admin@maatk12.edu", password: "first-password" })).toBeNull()
    expect(
      await verifyCredentials({ email: "admin@maatk12.edu", password: "second-password" }),
    ).not.toBeNull()
  })

  it("does nothing when the env vars are absent", async () => {
    await ensureEnvAdmin()
    expect(await User.countDocuments()).toBe(0)
  })
})
