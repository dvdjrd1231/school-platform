import { z } from "zod"

import { Group } from "@/lib/models"
import {
  ApiError,
  assertObjectId,
  handleErrors,
  hasRole,
  json,
  parseBody,
  requireUser,
  type SessionUser,
} from "@/lib/api/helpers"
import { courseScope } from "@/lib/api/scope"

export const runtime = "nodejs"

interface Params {
  params: Promise<{ id: string }>
}

const updateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(2000).optional(),
  maxMembers: z.number().int().min(0).max(200).optional(),
  joinPolicy: z.enum(["open", "closed"]).optional(),
})

/** PATCH /api/groups/:id — the group's owner, or a teacher/admin. */
export async function PATCH(req: Request, { params }: Params) {
  try {
    const me = await requireUser()
    const { id } = await params
    assertObjectId(id, "group id")

    const group = await Group.findById(id)
    if (!group) throw new ApiError(404, "Group not found")
    assertCanManage(me, group.createdBy)

    Object.assign(group, await parseBody(req, updateSchema))
    await group.save()

    return json(group.toObject())
  } catch (err) {
    return handleErrors(err)
  }
}

/** DELETE /api/groups/:id — the group's owner, or a teacher/admin. */
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const me = await requireUser()
    const { id } = await params
    assertObjectId(id, "group id")

    const group = await Group.findById(id)
    if (!group) throw new ApiError(404, "Group not found")
    assertCanManage(me, group.createdBy)

    await group.deleteOne()
    return json({ id, deleted: true })
  } catch (err) {
    return handleErrors(err)
  }
}

const membershipSchema = z.object({
  /** Omit to join or leave yourself; set to add or remove someone else. */
  userId: z.string().optional(),
  action: z.enum(["join", "leave"]),
})

/**
 * POST /api/groups/:id — join, leave, or (for the owner) add and remove others.
 *
 * Membership changes are a POST rather than separate routes because they're one
 * decision — "who is in this group" — and the rules for both directions are the
 * same.
 */
export async function POST(req: Request, { params }: Params) {
  try {
    const me = await requireUser()
    const { id } = await params
    assertObjectId(id, "group id")

    const group = await Group.findById(id)
    if (!group) throw new ApiError(404, "Group not found")

    const { userId, action } = await parseBody(req, membershipSchema)
    const target = userId ?? me.id
    const managingSomeoneElse = target !== me.id

    if (managingSomeoneElse) {
      assertCanManage(me, group.createdBy)
    } else {
      // Joining yourself requires being in the class and the group being open.
      const scope = await courseScope(me)
      if (!scope.unrestricted && !scope.ids.includes(String(group.course))) {
        throw new ApiError(403, "You're not in that class")
      }
      if (action === "join" && group.joinPolicy === "closed") {
        throw new ApiError(403, "This group is closed — ask its owner to add you")
      }
    }

    const members = group.members.map(String)

    if (action === "join") {
      if (members.includes(target)) return json({ id, members: members.length })
      if (group.maxMembers > 0 && members.length >= group.maxMembers) {
        throw new ApiError(409, `This group is full (${group.maxMembers} members)`)
      }
      group.members.push(target as never)
    } else {
      group.members = group.members.filter((m) => String(m) !== target) as never
    }

    await group.save()
    return json({ id, members: group.members.length })
  } catch (err) {
    return handleErrors(err)
  }
}

function assertCanManage(me: SessionUser, createdBy: unknown): void {
  if (String(createdBy) !== me.id && !hasRole(me, "teacher", "admin")) {
    throw new ApiError(403, "Only the group's owner or a teacher can do that")
  }
}
