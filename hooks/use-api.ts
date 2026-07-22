"use client"

import { useCallback, useEffect, useState } from "react"

import { apiGet } from "@/lib/api/client"

export interface ApiState<T> {
  data: T | null
  error: string | null
  isLoading: boolean
  /** Re-run the request (e.g. after a mutation). */
  refetch: () => Promise<void>
}

/**
 * Fetch JSON from an API route with loading and error state.
 *
 * Pass `null` as the url to skip fetching (useful when a required parameter
 * isn't ready yet). The request re-runs whenever the url changes.
 */
export function useApi<T>(url: string | null): ApiState<T> {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(url !== null)

  const load = useCallback(async () => {
    if (!url) {
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      setData(await apiGet<T>(url))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }, [url])

  useEffect(() => {
    void load()
  }, [load])

  return { data, error, isLoading, refetch: load }
}
