import mongoose from "mongoose"

// Serverless functions are re-invoked constantly and each invocation would open a
// fresh connection pool, exhausting MongoDB's connection limit. We cache the
// connection promise on globalThis so it survives hot reloads in dev and warm
// starts in production.

const MONGODB_URI = process.env.MONGODB_URI

interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  // eslint-disable-next-line no-var
  var _mongooseCache: MongooseCache | undefined
}

const cached: MongooseCache = global._mongooseCache ?? { conn: null, promise: null }
global._mongooseCache = cached

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn

  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not set. Add it to .env.local (see .env.example).")
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      // Fail fast rather than hanging a serverless invocation until timeout.
      serverSelectionTimeoutMS: 10_000,
      // bufferCommands queues operations while disconnected, which hides
      // connection failures behind confusing timeouts. Surface them instead.
      bufferCommands: false,
    })
  }

  try {
    cached.conn = await cached.promise
  } catch (err) {
    // Clear the rejected promise so the next request retries instead of
    // permanently caching the failure.
    cached.promise = null
    throw err
  }

  return cached.conn
}

/** Test helper: drop the cached connection so a fresh URI can be used. */
export async function disconnectDB(): Promise<void> {
  if (cached.conn) {
    await cached.conn.disconnect()
    cached.conn = null
    cached.promise = null
  }
}
