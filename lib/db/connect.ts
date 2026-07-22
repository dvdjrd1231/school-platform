import mongoose from "mongoose"

// Serverless functions are re-invoked constantly and each invocation would open a
// fresh connection pool, exhausting MongoDB's connection limit. We cache the
// connection promise on globalThis so it survives hot reloads in dev and warm
// starts in production.

/**
 * Resolve the connection string.
 *
 * Read lazily rather than at module scope: the value is captured at import
 * time otherwise, which makes a missing variable look like a permanent failure
 * even after it is configured. The fallbacks cover the different names the
 * Vercel/Atlas integrations inject depending on how the store was linked.
 */
function resolveUri(): { uri: string | undefined; source: string | undefined } {
  const candidates = [
    "MONGODB_URI",
    "MONGODB_URL",
    "DATABASE_URL",
    "MONGO_URL",
    "MONGODB_ATLAS_URI",
  ]
  for (const name of candidates) {
    const value = process.env[name]
    if (value) return { uri: value, source: name }
  }
  return { uri: undefined, source: undefined }
}

/** Strip credentials before an error message reaches a log or HTTP response. */
export function redactUri(message: string): string {
  return message.replace(/\/\/[^:@/]+:[^@/]+@/g, "//***:***@")
}

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

  const { uri } = resolveUri()
  if (!uri) {
    throw new Error(
      "No MongoDB connection string found. Set MONGODB_URI in your Vercel project " +
        "(Settings -> Environment Variables), then redeploy. See .env.example.",
    )
  }

  if (!cached.promise) {
    // Credentials are passed as options rather than embedded in the URI.
    // A password containing /, @, :, + or = — which `openssl rand -base64`
    // routinely produces — makes an interpolated URI unparseable ("Invalid
    // connection string"). Supplying them separately sidesteps percent-encoding
    // entirely. Falls back to whatever the URI carries when unset, so an Atlas
    // string with inline credentials keeps working.
    const username = process.env.MONGODB_USER
    const password = process.env.MONGODB_PASSWORD

    cached.promise = mongoose.connect(uri, {
      // A connection string from an integration often has no database in its
      // path, in which case Mongoose silently uses "test". Name it explicitly
      // so collections land somewhere predictable.
      dbName: process.env.MONGODB_DB || "school-platform",
      // Fail fast rather than hanging a serverless invocation until timeout.
      serverSelectionTimeoutMS: 10_000,
      // bufferCommands queues operations while disconnected, which hides
      // connection failures behind confusing timeouts. Surface them instead.
      bufferCommands: false,
      ...(username && password
        ? {
            auth: { username, password },
            authSource: process.env.MONGODB_AUTH_SOURCE || "admin",
          }
        : {}),
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
