import { z } from "zod"

import { User, USER_ROLES, hashPassword } from "@/lib/models"
import { ApiError, handleErrors, json, parseBody, requireRole } from "@/lib/api/helpers"

export const runtime = "nodejs"

const listQuerySchema = z.object({
  role: z.enum(USER_ROLES).optional(),
  status: z.enum(["active", "inactive"]).optional(),
  search: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
})

/** GET /api/users — admin/teacher directory with filtering and pagination. */
export async function GET(req: Request) {
  try {
    await requireRole("admin", "teacher")

    const params = listQuerySchema.parse(
      Object.fromEntries(new URL(req.url).searchParams.entries()),
    )

    const filter: Record<string, unknown> = {}
    if (params.role) filter.roles = params.role
    if (params.status) filter.status = params.status
    if (params.search) {
      // Escape regex metacharacters so a search for "a.b" isn't treated as a pattern.
      const safe = params.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      filter.$or = [{ name: new RegExp(safe, "i") }, { email: new RegExp(safe, "i") }]
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ name: 1 })
        .skip((params.page - 1) * params.limit)
        .limit(params.limit)
        .lean(),
      User.countDocuments(filter),
    ])

    return json({
      users,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        pages: Math.ceil(total / params.limit),
      },
    })
  } catch (err) {
    return handleErrors(err)
  }
}

const createUserSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8),
  roles: z.array(z.enum(USER_ROLES)).min(1),
  gradeLevel: z.string().optional(),
  subject: z.string().optional(),
  department: z.string().optional(),
  /** Student ids this user is a guardian for; only meaningful for parents. */
  children: z.array(z.string()).optional(),
})

/** POST /api/users — admin-only creation, including staff and parent accounts. */
export async function POST(req: Request) {
  try {
    await requireRole("admin")
    const body = await parseBody(req, createUserSchema)

    const existing = await User.findOne({ email: body.email.toLowerCase() })
    if (existing) throw new ApiError(409, "An account with that email already exists")

    const user = await User.create({
      ...body,
      email: body.email.toLowerCase(),
      passwordHash: await hashPassword(body.password),
      enrollmentDate: body.roles.includes("student") ? new Date() : undefined,
      studentId: body.roles.includes("student")
        ? `S-${String((await User.countDocuments({ roles: "student" })) + 1).padStart(5, "0")}`
        : undefined,
    })

    const { passwordHash: _omit, ...safe } = user.toObject()
    return json(safe, 201)
  } catch (err) {
    return handleErrors(err)
  }
}
