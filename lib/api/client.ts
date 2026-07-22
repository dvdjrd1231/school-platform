/**
 * Browser-side helpers for calling the REST API.
 *
 * Every request goes through here so error handling and the JSON contract are
 * consistent across the app. The server returns `{ error: string }` with a
 * non-2xx status on failure; these helpers turn that into a thrown Error whose
 * message is safe to show the user.
 */

async function parse(res: Response): Promise<unknown> {
  const text = await res.text()
  if (!text) return {}
  try {
    return JSON.parse(text)
  } catch {
    return { error: text }
  }
}

/** GET and return the parsed JSON body. Throws on non-2xx. */
export async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" })
  const body = (await parse(res)) as { error?: string }
  if (!res.ok) throw new Error(body.error ?? `Request failed (${res.status})`)
  return body as T
}

/** POST/PATCH/DELETE with an optional JSON body. Throws on non-2xx. */
export async function apiMutate<T>(
  url: string,
  method: "POST" | "PATCH" | "PUT" | "DELETE",
  body?: unknown,
): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = (await parse(res)) as { error?: string }
  if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`)
  return data as T
}
