"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertTriangle, Home, RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"

/**
 * Page-level error boundary.
 *
 * Without one, a single component throwing during render takes down the whole
 * app — the browser is left with a blank page and "Application error", which
 * looks exactly like the site being down. One bad record should cost one page,
 * not everything.
 */
export default function PageError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Goes to the browser console and, on the server, into the container logs,
    // so there is something to diagnose from beyond "it broke".
    console.error("[page error]", error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
          <AlertTriangle className="h-7 w-7 text-amber-700" />
        </div>

        <h1 className="mb-2 text-2xl font-bold">This page ran into a problem</h1>
        <p className="mb-6 text-muted-foreground">
          The rest of the site is still working. Try again, and if it keeps happening let us know
          what you were doing.
        </p>

        <div className="flex flex-wrap justify-center gap-2">
          <Button onClick={reset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Try again
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go home
            </Link>
          </Button>
        </div>

        {error.digest && (
          <p className="mt-6 font-mono text-xs text-muted-foreground">
            Reference: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}
