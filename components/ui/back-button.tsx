"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"

interface BackButtonProps {
  /** Where to go when there's no history to go back to (e.g. a fresh tab). */
  fallback: string
  label?: string
  className?: string
}

/**
 * "Back" that returns to the page you actually came from.
 *
 * Pages used to hard-code `router.push("/courses")`, which sent you somewhere
 * you may never have been. This uses real history and only falls back to a fixed
 * route when there is no history entry to return to.
 */
export function BackButton({ fallback, label = "Back", className }: BackButtonProps) {
  const router = useRouter()

  const goBack = () => {
    // A direct load (deep link, refresh) has a history length of 1 — nothing to
    // go back to, so use the fallback instead of leaving the user stuck.
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back()
    } else {
      router.push(fallback)
    }
  }

  return (
    <Button variant="ghost" onClick={goBack} className={className}>
      <ArrowLeft className="mr-2 h-4 w-4" />
      {label}
    </Button>
  )
}
