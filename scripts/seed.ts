/**
 * Seed the database from the command line.
 *
 *   pnpm seed          # insert if empty
 *   pnpm seed --reset  # wipe the seeded collections first
 *
 * The actual seeding lives in lib/db/seed.ts so the CLI and the /api/seed
 * endpoint share one implementation.
 */
import "dotenv/config"

import { disconnectDB } from "../lib/db/connect"
import { DEFAULT_PASSWORD, seedDatabase } from "../lib/db/seed"

async function main() {
  const reset = process.argv.includes("--reset")
  const result = await seedDatabase({ reset })

  if (!result.seeded) {
    console.log(result.reason)
  } else {
    console.log("Seed complete:", result.counts)
    console.log(`\nAll accounts use the password: ${DEFAULT_PASSWORD}`)
    for (const a of result.accounts ?? []) {
      console.log(`  ${a.email.padEnd(28)} (${a.role})`)
    }
    console.log("\nChange these passwords before any real deployment.")
  }

  await disconnectDB()
}

main().catch((err) => {
  console.error("Seed failed:", err)
  process.exit(1)
})
