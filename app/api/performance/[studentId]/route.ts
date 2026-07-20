import { User } from "@/lib/models"
import { buildPerformanceReport, reportToCSV } from "@/lib/services/performance"
import {
  ApiError,
  assertObjectId,
  handleErrors,
  hasRole,
  json,
  requireUser,
} from "@/lib/api/helpers"

export const runtime = "nodejs"

type Params = { params: Promise<{ studentId: string }> }

/**
 * GET /api/performance/:studentId
 *
 * Add ?format=csv for the export deliverable.
 *
 * Visibility: the student themselves, a parent listed as their guardian,
 * any teacher, or an admin. The guardian check is what keeps one parent from
 * reading another family's records.
 */
export async function GET(req: Request, { params }: Params) {
  try {
    const { studentId } = await params
    assertObjectId(studentId, "student id")
    const me = await requireUser()

    await assertCanViewStudent(me, studentId)

    const report = await buildPerformanceReport(studentId)

    if (new URL(req.url).searchParams.get("format") === "csv") {
      const student = await User.findById(studentId).select("name").lean()
      const csv = reportToCSV(report, student?.name ?? "Unknown")
      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="performance-${studentId}.csv"`,
        },
      })
    }

    return json(report)
  } catch (err) {
    return handleErrors(err)
  }
}

async function assertCanViewStudent(
  me: { id: string; roles: string[] },
  studentId: string,
): Promise<void> {
  if (me.id === studentId) return
  if (hasRole(me as never, "admin", "teacher")) return

  if (hasRole(me as never, "parent")) {
    const parent = await User.findById(me.id).select("children").lean()
    const isGuardian = parent?.children?.some((c) => String(c) === studentId)
    if (isGuardian) return
    throw new ApiError(403, "You are not listed as a guardian for this student")
  }

  throw new ApiError(403, "You may only view your own performance")
}
