import { z } from "zod"

import { Category } from "@/lib/models"
import {
  ApiError,
  handleErrors,
  json,
  parseBody,
  requireRole,
  requireUser,
} from "@/lib/api/helpers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export interface CategoryNode {
  _id: string
  name: string
  path: string[]
  order: number
  children: CategoryNode[]
}

/**
 * GET /api/categories — the whole tree, nested.
 *
 * Everyone signed in can read it: it's the filing structure every upload form
 * needs. Only admins can change it.
 */
export async function GET() {
  try {
    await requireUser()

    const all = await Category.find().sort({ order: 1, name: 1 }).lean()

    const byId = new Map<string, CategoryNode>()
    for (const c of all) {
      byId.set(String(c._id), {
        _id: String(c._id),
        name: c.name,
        path: c.path,
        order: c.order,
        children: [],
      })
    }

    const roots: CategoryNode[] = []
    for (const c of all) {
      const node = byId.get(String(c._id))!
      const parent = c.parent ? byId.get(String(c.parent)) : undefined
      if (parent) parent.children.push(node)
      else roots.push(node)
    }

    return json({ categories: roots, flat: all.map((c) => ({ ...c, _id: String(c._id) })) })
  } catch (err) {
    return handleErrors(err)
  }
}

const createSchema = z.object({
  name: z.string().min(1).max(80),
  parent: z.string().nullable().optional(),
})

/** POST /api/categories — admins add a category or subcategory. */
export async function POST(req: Request) {
  try {
    await requireRole("admin")
    const body = await parseBody(req, createSchema)

    let path = [body.name.trim()]
    if (body.parent) {
      const parent = await Category.findById(body.parent).select("path").lean()
      if (!parent) throw new ApiError(404, "Parent category not found")
      path = [...parent.path, body.name.trim()]
    }

    const siblings = await Category.countDocuments({ parent: body.parent ?? null })

    const category = await Category.create({
      name: body.name.trim(),
      parent: body.parent ?? null,
      path,
      order: siblings,
    })

    return json(category.toObject(), 201)
  } catch (err) {
    return handleErrors(err)
  }
}
