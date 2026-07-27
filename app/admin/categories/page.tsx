"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, FolderTree, Loader2, Pencil, Plus, Trash2 } from "lucide-react"

import { useApi } from "@/hooks/use-api"
import { apiMutate } from "@/lib/api/client"
import { AsyncState } from "@/components/ui/async-state"
import { useConfirm } from "@/components/ui/confirm-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { CategoryNode } from "@/components/files/category-picker"

/**
 * Admin › Categories — the filing tree used by media, the library, portfolios
 * and the seminar area.
 *
 * Any depth is allowed; the client's example (Grade › Subject › Unit › Lesson)
 * is just one way to use it. A category can't be deleted while anything is
 * still filed under it.
 */
export default function CategoryManagement() {
  const { data, error, isLoading, refetch } = useApi<{ categories: CategoryNode[] }>(
    "/api/categories",
  )
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const [dialog, setDialog] = useState<
    { mode: "create"; parent: CategoryNode | null } | { mode: "rename"; node: CategoryNode } | null
  >(null)
  const [name, setName] = useState("")
  const [formError, setFormError] = useState("")
  const [saving, setSaving] = useState(false)
  const [confirm, confirmDialog] = useConfirm()

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const openCreate = (parent: CategoryNode | null) => {
    setDialog({ mode: "create", parent })
    setName("")
    setFormError("")
  }

  const openRename = (node: CategoryNode) => {
    setDialog({ mode: "rename", node })
    setName(node.name)
    setFormError("")
  }

  const save = async () => {
    if (!dialog) return
    if (!name.trim()) return setFormError("Give the category a name")

    setSaving(true)
    setFormError("")
    try {
      if (dialog.mode === "create") {
        await apiMutate("/api/categories", "POST", {
          name: name.trim(),
          parent: dialog.parent?._id ?? null,
        })
        if (dialog.parent) setExpanded((prev) => new Set(prev).add(dialog.parent!._id))
      } else {
        await apiMutate(`/api/categories/${dialog.node._id}`, "PATCH", { name: name.trim() })
      }
      setDialog(null)
      await refetch()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not save the category")
    } finally {
      setSaving(false)
    }
  }

  const remove = async (node: CategoryNode) => {
    const ok = await confirm({
      title: `Delete "${node.name}"?`,
      description:
        "Only empty categories can be deleted — move or remove anything filed under it first.",
    })
    if (!ok) return
    try {
      await apiMutate(`/api/categories/${node._id}`, "DELETE")
      await refetch()
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Could not delete the category")
    }
  }

  const renderNode = (node: CategoryNode, depth = 0) => {
    const isOpen = expanded.has(node._id)
    const hasChildren = node.children.length > 0

    return (
      <div key={node._id}>
        <div
          className="flex items-center justify-between gap-2 rounded-md px-2 py-2 hover:bg-muted/50"
          style={{ paddingLeft: `${depth * 20 + 8}px` }}
        >
          <button
            type="button"
            className="flex min-w-0 flex-1 items-center gap-2 text-left"
            onClick={() => hasChildren && toggle(node._id)}
          >
            {hasChildren ? (
              isOpen ? (
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              )
            ) : (
              <span className="w-4" />
            )}
            <span className="truncate font-medium">{node.name}</span>
            {hasChildren && (
              <span className="text-xs text-muted-foreground">({node.children.length})</span>
            )}
          </button>

          <div className="flex shrink-0 items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => openCreate(node)}>
              <Plus className="mr-1 h-3.5 w-3.5" />
              Subcategory
            </Button>
            <Button variant="ghost" size="icon" onClick={() => openRename(node)}>
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Rename</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-red-600"
              onClick={() => void remove(node)}
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete</span>
            </Button>
          </div>
        </div>

        {isOpen && node.children.map((child) => renderNode(child, depth + 1))}
      </div>
    )
  }

  const roots = data?.categories ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-600">
            How uploads are filed across My Media, the gallery, the library and portfolios.
          </p>
        </div>
        <Button onClick={() => openCreate(null)}>
          <Plus className="mr-2 h-4 w-4" />
          Add top-level category
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FolderTree className="h-5 w-5" />
            Category tree
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AsyncState
            isLoading={isLoading}
            error={error}
            isEmpty={roots.length === 0}
            emptyMessage="No categories yet. Add one to get started — for example 1st Grade, then Math inside it."
            onRetry={refetch}
          >
            <div className="divide-y">{roots.map((node) => renderNode(node))}</div>
          </AsyncState>
        </CardContent>
      </Card>

      <Dialog open={dialog !== null} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {dialog?.mode === "rename" ? "Rename category" : "Add a category"}
            </DialogTitle>
            <DialogDescription>
              {dialog?.mode === "create" && dialog.parent
                ? `Inside ${dialog.parent.path.join(" › ")}`
                : dialog?.mode === "create"
                  ? "A new top-level category."
                  : "Anything already filed here follows the new name."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. 1st Grade, Math, Unit 1"
              onKeyDown={(e) => e.key === "Enter" && void save()}
            />
            {formError && <p className="text-sm text-red-600">{formError}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={() => void save()} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {confirmDialog}
    </div>
  )
}
