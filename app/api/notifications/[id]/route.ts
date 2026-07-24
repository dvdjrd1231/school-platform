import { Notification } from "@/lib/models"
import { ApiError, assertObjectId, handleErrors, json, requireUser } from "@/lib/api/helpers"

export const runtime = "nodejs"

type Params = { params: Promise<{ id: string }> }

/** PATCH /api/notifications/:id — mark one notification read. Owner only. */
export async function PATCH(_req: Request, { params }: Params) {
  try {
    const { id } = await params
    assertObjectId(id, "notification id")
    const me = await requireUser()

    // Scope to the owner so a user can't touch someone else's notification.
    const notification = await Notification.findOneAndUpdate(
      { _id: id, user: me.id },
      { isRead: true },
      { new: true },
    ).lean()
    if (!notification) throw new ApiError(404, "Notification not found")

    return json({ id, isRead: true })
  } catch (err) {
    return handleErrors(err)
  }
}
