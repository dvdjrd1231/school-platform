"use client"

import { useEffect, useRef } from "react"

import { getRealtimeClient } from "@/lib/realtime/client"

/**
 * Subscribe to a private channel and run `onEvent` for each matching event.
 *
 * A no-op when Pusher isn't configured (no NEXT_PUBLIC_PUSHER_KEY) — messages
 * are already persisted server-side, so callers fall back to fetch-on-mount and
 * the feature degrades to "not instant" rather than breaking.
 *
 * Pass `null` as the channel to skip subscribing.
 */
export function useRealtimeChannel(
  channel: string | null,
  event: string,
  onEvent: (payload: unknown) => void,
): void {
  // Keep the latest callback without making it a subscription dependency —
  // otherwise every render would unsubscribe and resubscribe.
  const handlerRef = useRef(onEvent)
  useEffect(() => {
    handlerRef.current = onEvent
  }, [onEvent])

  useEffect(() => {
    if (!channel) return
    const client = getRealtimeClient()
    if (!client) return

    const sub = client.subscribe(channel)
    const listener = (payload: unknown) => handlerRef.current(payload)
    sub.bind(event, listener)

    return () => {
      sub.unbind(event, listener)
      client.unsubscribe(channel)
    }
  }, [channel, event])
}

/** True when real-time delivery is available in this deployment. */
export function isRealtimeEnabled(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_PUSHER_KEY && process.env.NEXT_PUBLIC_PUSHER_CLUSTER)
}
