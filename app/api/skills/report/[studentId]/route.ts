import { User } from "@/lib/models"
import { buildSkillReport } from "@/lib/services/skills"
import { ApiError, assertObjectId, handleErrors, hasRole, json, requireUser } from "@/lib/api/helpers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type Params = { params: Promise<{ studentId: string }> }

/**
 * GET /api/skills/report/:studentId
 *
 * Visibility mirrors the performance report: the student themselves, a parent
 * who is that student's guardian, any teacher, or an admin.
 */
export async function GET(_req: Request, { params }: Params) {
  try {
    const { studentId } = await params
    assertObjectId(studentId, "student id")
    const me = await requireUser()

    if (me.id !== studentId && !hasRole(me, "admin", "teacher")) {
      if (hasRole(me, "parent")) {
        const parent = await User.findById(me.id).select("children").lean()
        const isGuardian = parent?.children?.some((c) => String(c) === studentId)
        if (!isGuardian) throw new ApiError(403, "You are not listed as a guardian for this student")
      } else {
        throw new ApiError(403, "You may only view your own skills report")
      }
    }

    return json(await buildSkillReport(studentId))
  } catch (err) {
    return handleErrors(err)
  }
}
