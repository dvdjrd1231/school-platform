import { defineConfig } from "vitest/config"
import path from "node:path"

// Uses the .mts extension so Node loads this as ESM. Vite 7 is ESM-only, and a
// plain .ts config gets resolved through Vitest's CJS entry, which then fails
// to require() it.
export default defineConfig({
  test: {
    environment: "node",
    include: ["**/__tests__/**/*.test.ts", "**/*.test.ts"],
    exclude: ["node_modules/**", ".next/**"],
    coverage: {
      provider: "v8",
      include: ["lib/services/**", "lib/api/**"],
    },
  },
  resolve: {
    alias: { "@": path.resolve(process.cwd()) },
  },
})
