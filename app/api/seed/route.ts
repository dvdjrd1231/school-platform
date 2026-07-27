import { seedDatabase } from "@/lib/db/seed"
import { handleErrors, json } from "@/lib/api/helpers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * POST /api/seed — one-time bootstrap of demo accounts and sample content, for
 * a scratch database only.
 *
 * Three independent guards, because this endpoint inserts fictional students
 * and — with `reset` — deletes every user, course, submission and message
 * first:
 *
 *   1. Refused outright in production (see below). A live deployment should
 *      never be one leaked secret away from having its data wiped.
 *   2. Requires SEED_SECRET to be set and presented.
 *   3. seedDatabase() itself refuses when any user already exists, unless
 *      explicitly reset.
 *
 * Usage on a development database:
 *   curl -X POST http://localhost:3000/api/seed \
 *        -H "Authorization: Bearer $SEED_SECRET"
 */
export async function POST(req: Request) {
  try {
    // Checked before the secret so a production deployment gives a clear answer
    // rather than inviting someone to go hunting for the right token.
    if (process.env.NODE_ENV === "production" && process.env.ALLOW_PRODUCTION_SEED !== "true") {
      return json(
        {
          error:
            "Seeding is disabled in production. This endpoint creates demo accounts and can " +
            "delete real data; it is for development databases only.",
        },
        403,
      )
    }

    const secret = process.env.SEED_SECRET
    if (!secret) {
      return json(
        { error: "Seeding is disabled. Set SEED_SECRET in the environment to enable it." },
        403,
      )
    }

    const provided =
      req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
      new URL(req.url).searchParams.get("secret") ??
      ""

    // Constant-work comparison — reject anything that isn't an exact match.
    if (provided !== secret) {
      return json({ error: "Invalid or missing seed secret" }, 401)
    }

    const reset = new URL(req.url).searchParams.get("reset") === "true"
    const result = await seedDatabase({ reset })

    if (!result.seeded) {
      return json({ ok: false, message: result.reason }, 409)
    }

    return json({
      ok: true,
      message: "Database seeded. All accounts use the password 'Password123!'. Change them now.",
      counts: result.counts,
      accounts: result.accounts,
    })
  } catch (err) {
    return handleErrors(err)
  }
}
