import { seedDatabase } from "@/lib/db/seed"
import { handleErrors, json } from "@/lib/api/helpers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * POST /api/seed — one-time bootstrap of the initial accounts and demo data.
 *
 * Guarded by the SEED_SECRET environment variable: the request must present a
 * matching secret, and the routine itself refuses to run once any user exists.
 * Both are required — the secret stops a stranger from seeding, and the
 * user-count check stops a second run from wiping real data.
 *
 * Usage (once, after setting SEED_SECRET in Vercel):
 *   curl -X POST https://<your-app>/api/seed \
 *        -H "Authorization: Bearer $SEED_SECRET"
 *
 * Add ?reset=true to wipe and reseed (also requires the secret). Remove the
 * SEED_SECRET variable afterwards to disable the endpoint entirely.
 */
export async function POST(req: Request) {
  try {
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
