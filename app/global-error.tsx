"use client"

import { useEffect } from "react"

/**
 * Last-resort error boundary.
 *
 * Catches failures in the root layout itself, which app/error.tsx cannot —
 * it lives inside that layout. This one replaces the whole document, so it
 * ships its own <html> and <body> and deliberately uses inline styles: if the
 * layout failed, the stylesheet may not have loaded either.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[global error]", error)
  }, [error])

  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, -apple-system, sans-serif",
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          margin: 0,
          padding: "1.5rem",
          background: "#fafafa",
          color: "#111",
        }}
      >
        <div style={{ maxWidth: "28rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Something went wrong</h1>
          <p style={{ color: "#555", marginBottom: "1.5rem" }}>
            The page couldn&apos;t be loaded. Reloading usually fixes it.
          </p>

          <button
            onClick={reset}
            style={{
              background: "#059669",
              color: "white",
              border: 0,
              borderRadius: "0.375rem",
              padding: "0.6rem 1.2rem",
              fontSize: "0.95rem",
              cursor: "pointer",
            }}
          >
            Reload
          </button>

          {error.digest && (
            <p style={{ marginTop: "1.5rem", fontSize: "0.75rem", color: "#888" }}>
              Reference: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  )
}
