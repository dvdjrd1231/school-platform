import { z } from "zod"

import { User, USER_ROLES, hashPassword } from "@/lib/models"
import {
  ApiError,
  assertObjectId,
  handleErrors,
  hasRole,
  json,
  parseBody,
  requireUser,
} from "@/lib/api/helpers"

export const runtime = "nodejs"

type Params = { params: Promise<{ id: string }> }

/** GET /api/users/:id — own profile, or any profile for staff. */
export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params
    assertObjectId(id)
    const me = await requireUser()

    if (me.id !== id && !hasRole(me, "admin", "teacher")) {
      throw new ApiError(403, "You may only view your own profile")
    }

    const user = await User.findById(id).populate("children", "name email studentId").lean()
    if (!user) throw new ApiError(404, "User not found")

    return json(user)
  } catch (err) {
    return handleErrors(err)
  }
}

const updateSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  status: z.enum(["active", "inactive"]).optional(),
  roles: z.array(z.enum(USER_ROLES)).min(1).optional(),
  gradeLevel: z.string().optional(),
  subject: z.string().optional(),
  department: z.string().optional(),
  officeHours: z.string().optional(),
  bio: z.string().max(2000).optional(),
  avatar: z.string().url().optional(),
  children: z.array(z.string()).optional(),
})

/** PATCH /api/users/:id — own profile, or any profile for admins. */
export async function PATCH(req: Request, { params }: Params) {
  try {
    const { id } = await params
    assertObjectId(id)
    const me = await requireUser()
    const isAdmin = hasRole(me, "admin")

    if (me.id !== id && !isAdmin) {
      throw new ApiError(403, "You may only edit your own profile")
    }

    const body = await parseBody(req, updateSchema)

    // Privilege escalation guard: only admins may change roles, account status,
    // or guardian links. A student editing their own profile must not be able
    // to promote themselves by including `roles` in the payload.
    if (!isAdmin && (body.roles || body.status || body.children)) {
      throw new ApiError(403, "Only an administrator can change roles, status, or guardians")
    }

    const { password, ...rest } = body
    const update: Record<string, unknown> = { ...rest }
    if (password) update.passwordHash = await hashPassword(password)
    if (rest.email) update.email = rest.email.toLowerCase()

    const user = await User.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    }).lean()
    if (!user) throw new ApiError(404, "User not found")

    return json(user)
  } catch (err) {
    return handleErrors(err)
  }
}

/**
 * DELETE /api/users/:id — admin only.
 *
 * Deactivates rather than removes: submissions, grades, and messages reference
 * this user, and a hard delete would orphan them.
 */
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id } = await params
    assertObjectId(id)
    const me = await requireUser()
    if (!hasRole(me, "admin")) throw new ApiError(403, "Requires role: admin")
    if (me.id === id) throw new ApiError(400, "You cannot deactivate your own account")

    const user = await User.findByIdAndUpdate(id, { status: "inactive" }, { new: true }).lean()
    if (!user) throw new ApiError(404, "User not found")

    return json({ id, status: "inactive" })
  } catch (err) {
    return handleErrors(err)
  }
}
