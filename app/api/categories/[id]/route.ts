import { z } from "zod"

import { Category, FileAsset } from "@/lib/models"
import {
  ApiError,
  assertObjectId,
  handleErrors,
  json,
  parseBody,
  requireRole,
} from "@/lib/api/helpers"

export const runtime = "nodejs"

interface Params {
  params: Promise<{ id: string }>
}

const updateSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  order: z.number().int().min(0).optional(),
})

/**
 * PATCH /api/categories/:id — rename or reorder.
 *
 * Renaming rewrites `path` on this node and everything beneath it, since files
 * are filtered by path rather than by walking parents.
 */
export async function PATCH(req: Request, { params }: Params) {
  try {
    await requireRole("admin")
    const { id } = await params
    assertObjectId(id, "category id")

    const category = await Category.findById(id)
    if (!category) throw new ApiError(404, "Category not found")

    const body = await parseBody(req, updateSchema)
    const oldPath = [...category.path]

    if (body.order !== undefined) category.order = body.order

    if (body.name && body.name.trim() !== category.name) {
      category.name = body.name.trim()
      category.path = [...oldPath.slice(0, -1), category.name]
      await category.save()
      await rewriteDescendantPaths(oldPath, category.path)
      await FileAsset.updateMany(
        { categoryPath: { $all: oldPath } },
        { $set: { [`categoryPath.${oldPath.length - 1}`]: category.name } },
      )
    } else {
      await category.save()
    }

    return json(category.toObject())
  } catch (err) {
    return handleErrors(err)
  }
}

/**
 * DELETE /api/categories/:id
 *
 * Refused while the category still has subcategories or filed items, so nothing
 * is silently orphaned — the same rule the client asked for on classes.
 */
export async function DELETE(_req: Request, { params }: Params) {
  try {
    await requireRole("admin")
    const { id } = await params
    assertObjectId(id, "category id")

    const category = await Category.findById(id)
    if (!category) throw new ApiError(404, "Category not found")

    const [children, files] = await Promise.all([
      Category.countDocuments({ parent: id }),
      FileAsset.countDocuments({ categoryPath: { $all: category.path } }),
    ])

    if (children > 0 || files > 0) {
      throw new ApiError(
        409,
        `Empty this category first — it has ${children} subcategor${children === 1 ? "y" : "ies"} and ${files} item(s).`,
      )
    }

    await category.deleteOne()
    return json({ id, deleted: true })
  } catch (err) {
    return handleErrors(err)
  }
}

/** Rewrite the stored path prefix on every descendant after a rename. */
async function rewriteDescendantPaths(oldPath: string[], newPath: string[]): Promise<void> {
  const descendants = await Category.find({
    path: { $all: oldPath },
    _id: { $ne: null },
  })

  for (const node of descendants) {
    // `$all` also matches the node itself and unrelated nodes that merely
    // contain the same names, so confirm this really is a prefix match.
    const isDescendant =
      node.path.length > oldPath.length &&
      oldPath.every((segment, i) => node.path[i] === segment)
    if (!isDescendant) continue

    node.path = [...newPath, ...node.path.slice(oldPath.length)]
    await node.save()
  }
}
