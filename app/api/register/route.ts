import { z } from "zod"

import { connectDB } from "@/lib/db/connect"
import { User, hashPassword } from "@/lib/models"
import { ApiError, handleErrors, json, parseBody } from "@/lib/api/helpers"

export const runtime = "nodejs"

const registerSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  gradeLevel: z.string().optional(),
  dateOfBirth: z.coerce.date().optional(),
})

/**
 * Public student self-registration.
 *
 * Deliberately does NOT accept a `roles` field — otherwise anyone could POST
 * `{"roles":["admin"]}` and grant themselves admin. Admin accounts come from
 * the ADMIN_USER / ADMIN_PASSWORD environment variables (see lib/auth/
 * ensure-admin.ts); other staff are created by an admin via POST /api/users.
 */
export async function POST(req: Request) {
  try {
    const body = await parseBody(req, registerSchema)
    await connectDB()

    const existing = await User.findOne({ email: body.email.toLowerCase() })
    if (existing) throw new ApiError(409, "An account with that email already exists")

    const user = await User.create({
      name: body.name,
      email: body.email.toLowerCase(),
      passwordHash: await hashPassword(body.password),
      roles: ["student"],
      status: "active",
      gradeLevel: body.gradeLevel,
      dateOfBirth: body.dateOfBirth,
      studentId: await nextStudentId(),
      enrollmentDate: new Date(),
    })

    return json(
      {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        studentId: user.studentId,
        roles: user.roles,
      },
      201,
    )
  } catch (err) {
    return handleErrors(err)
  }
}

/** Sequential student ID in the form S-00001. */
async function nextStudentId(): Promise<string> {
  const count = await User.countDocuments({ roles: "student" })
  return `S-${String(count + 1).padStart(5, "0")}`
}
