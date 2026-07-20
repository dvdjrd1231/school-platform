import { handlers } from "@/lib/auth"

export const { GET, POST } = handlers

// Mongoose requires the Node runtime; it cannot run on Edge.
export const runtime = "nodejs"
