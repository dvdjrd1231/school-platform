"use client"

import { useMemo } from "react"

import { useApi } from "@/hooks/use-api"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export interface CategoryNode {
  _id: string
  name: string
  path: string[]
  order: number
  children: CategoryNode[]
}

interface FlatCategory {
  _id: string
  name: string
  path: string[]
}

/** Depth-first walk producing "Grade › Subject › Unit" labels for a flat list. */
function flatten(nodes: CategoryNode[], out: FlatCategory[] = []): FlatCategory[] {
  for (const node of nodes) {
    out.push({ _id: node._id, name: node.name, path: node.path })
    flatten(node.children, out)
  }
  return out
}

interface Props {
  /** The chosen path, e.g. ["1st Grade","Math","Unit 1"]. Empty means unfiled. */
  value: string[]
  onChange: (path: string[]) => void
  label?: string
  /** Adds an "everything" option — used when filtering rather than filing. */
  allowAll?: boolean
}

/**
 * Pick a place in the admin-defined filing tree.
 *
 * One flat select showing the full path is deliberate: a cascade of four
 * dependent dropdowns is worse to use, and the tree is small enough that the
 * whole list fits comfortably.
 */
export function CategoryPicker({ value, onChange, label = "Category", allowAll }: Props) {
  const { data } = useApi<{ categories: CategoryNode[] }>("/api/categories")
  const options = useMemo(() => flatten(data?.categories ?? []), [data])

  const current = value.length > 0 ? value.join("/") : allowAll ? "__all__" : "__none__"

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select
        value={current}
        onValueChange={(v) => onChange(v === "__all__" || v === "__none__" ? [] : v.split("/"))}
      >
        <SelectTrigger>
          <SelectValue placeholder="Choose a category" />
        </SelectTrigger>
        <SelectContent>
          {allowAll ? (
            <SelectItem value="__all__">All categories</SelectItem>
          ) : (
            <SelectItem value="__none__">Uncategorised</SelectItem>
          )}
          {options.map((option) => (
            <SelectItem key={option._id} value={option.path.join("/")}>
              {option.path.join(" › ")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {options.length === 0 && (
        <p className="text-xs text-muted-foreground">
          No categories defined yet — an admin can set them up under Admin › Categories.
        </p>
      )}
    </div>
  )
}
