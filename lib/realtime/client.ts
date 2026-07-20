"use client"

import PusherClient from "pusher-js"

/**
 * Browser-side real-time client.
 *
 * A single shared connection is reused across hooks; Pusher's free tier counts
 * concurrent connections, and one per component would exhaust it quickly.
 */

let instance: PusherClient | null = null

export function getRealtimeClient(): PusherClient | null {
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER
  // Not configured: callers fall back to fetch-on-mount and polling.
  if (!key || !cluster) return null

  instance ??= new PusherClient(key, {
    cluster,
    authEndpoint: "/api/pusher/auth",
    // Session cookie rides along automatically; the auth route reads it.
  })

  return instance
}

export function disconnectRealtime(): void {
  instance?.disconnect()
  instance = null
}
