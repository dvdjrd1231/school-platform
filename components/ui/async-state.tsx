"use client"

import type { ReactNode } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AsyncStateProps {
  isLoading: boolean
  error: string | null
  /** True when the request succeeded but returned nothing to show. */
  isEmpty?: boolean
  emptyMessage?: string
  onRetry?: () => void
  children: ReactNode
}

/**
 * Standard loading / error / empty rendering for data-backed pages, so every
 * page handles these states the same way instead of each inventing its own.
 */
export function AsyncState({
  isLoading,
  error,
  isEmpty,
  emptyMessage = "Nothing to show yet.",
  onRetry,
  children,
}: AsyncStateProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading…
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-16 text-center">
        <p className="mb-3 text-red-600">{error}</p>
        {onRetry && (
          <Button variant="outline" onClick={onRetry}>
            Try again
          </Button>
        )}
      </div>
    )
  }

  if (isEmpty) {
    return <div className="py-16 text-center text-muted-foreground">{emptyMessage}</div>
  }

  return <>{children}</>
}
