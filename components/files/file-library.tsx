"use client"

import { useMemo, useRef, useState } from "react"
import {
  Download,
  Eye,
  FileText,
  Film,
  Image as ImageIcon,
  Loader2,
  Music,
  Pencil,
  Search,
  Trash2,
  Upload,
} from "lucide-react"

import { useApi } from "@/hooks/use-api"
import { apiMutate } from "@/lib/api/client"
import { useCourses } from "@/components/context/course-context"
import { useRole } from "@/components/context/role-context"
import { AsyncState } from "@/components/ui/async-state"
import { useConfirm } from "@/components/ui/confirm-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { CategoryPicker } from "@/components/files/category-picker"

export type FileContext =
  | "media"
  | "gallery"
  | "library"
  | "portfolio"
  | "seminar"
  | "lesson"
  | "report"

export interface StoredFile {
  _id: string
  filename: string
  contentType: string
  size: number
  title?: string
  description?: string
  categoryPath: string[]
  tags: string[]
  visibility: "private" | "course" | "school"
  downloads: number
  createdAt: string
  owner?: { _id: string; name?: string } | null
  course?: { _id: string; title: string } | null
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const units = ["KB", "MB", "GB"]
  let value = bytes / 1024
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit++
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unit]}`
}

function kindOf(contentType: string): "image" | "video" | "audio" | "pdf" | "other" {
  if (contentType.startsWith("image/")) return "image"
  if (contentType.startsWith("video/")) return "video"
  if (contentType.startsWith("audio/")) return "audio"
  if (contentType === "application/pdf") return "pdf"
  return "other"
}

function FileIcon({ contentType }: { contentType: string }) {
  const kind = kindOf(contentType)
  if (kind === "image") return <ImageIcon className="h-5 w-5" />
  if (kind === "video") return <Film className="h-5 w-5" />
  if (kind === "audio") return <Music className="h-5 w-5" />
  return <FileText className="h-5 w-5" />
}

interface Props {
  context: FileContext
  title: string
  description: string
  /** Pin to one class — the class gallery and lesson materials do this. */
  courseId?: string
  /** Default visibility for new uploads in this area. */
  defaultVisibility?: StoredFile["visibility"]
  /** Only staff may upload here (the digital library). */
  uploadRequiresStaff?: boolean
}

/**
 * The shared file area behind My Media, the Class Media Gallery, the Digital
 * Library and e-portfolios.
 *
 * Every one of those screens had upload/preview/download/delete buttons that
 * did nothing, because there was no storage behind them. They're now one
 * component over one API, differing only in which `context` they read and write
 * and who is allowed to upload.
 */
export function FileLibrary({
  context,
  title,
  description,
  courseId,
  defaultVisibility = "private",
  uploadRequiresStaff = false,
}: Props) {
  const { userId, isTeacher, isAdmin } = useRole()
  const { courses } = useCourses()
  const isStaff = isTeacher || isAdmin
  const canUpload = !uploadRequiresStaff || isStaff

  const [categoryFilter, setCategoryFilter] = useState<string[]>([])
  const [search, setSearch] = useState("")

  const query = new URLSearchParams({ context })
  if (courseId) query.set("courseId", courseId)
  if (categoryFilter.length > 0) query.set("category", categoryFilter.join("/"))

  const { data, error, isLoading, refetch } = useApi<{ files: StoredFile[] }>(
    `/api/files?${query}`,
  )

  const files = useMemo(() => {
    const all = data?.files ?? []
    const q = search.trim().toLowerCase()
    if (!q) return all
    return all.filter(
      (f) =>
        (f.title ?? f.filename).toLowerCase().includes(q) ||
        (f.description ?? "").toLowerCase().includes(q) ||
        f.tags.some((t) => t.toLowerCase().includes(q)),
    )
  }, [data, search])

  // Upload dialog state.
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [pending, setPending] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const [meta, setMeta] = useState({
    title: "",
    description: "",
    categoryPath: [] as string[],
    tags: "",
    visibility: defaultVisibility,
    courseId: courseId ?? "",
  })

  // Preview + edit state.
  const [previewing, setPreviewing] = useState<StoredFile | null>(null)
  const [editing, setEditing] = useState<StoredFile | null>(null)
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    categoryPath: [] as string[],
    tags: "",
    visibility: "private" as StoredFile["visibility"],
  })
  const [confirm, confirmDialog] = useConfirm()

  const chooseFiles = () => inputRef.current?.click()

  const onFilesChosen = (list: FileList | null) => {
    if (!list || list.length === 0) return
    setPending(Array.from(list))
    setMeta((m) => ({
      ...m,
      title: list.length === 1 ? list[0].name.replace(/\.[^.]+$/, "") : "",
      visibility: defaultVisibility,
      courseId: courseId ?? "",
    }))
    setUploadError("")
    setUploadOpen(true)
  }

  const upload = async () => {
    if (pending.length === 0) return
    setUploading(true)
    setUploadError("")

    try {
      for (const file of pending) {
        const form = new FormData()
        form.append("file", file)
        form.append(
          "meta",
          JSON.stringify({
            context,
            courseId: meta.courseId || undefined,
            // With several files at once a single typed title would be wrong for
            // all but the first, so each keeps its own name.
            title: pending.length === 1 ? meta.title || file.name : file.name,
            description: meta.description || undefined,
            categoryPath: meta.categoryPath,
            tags: meta.tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean),
            visibility: meta.visibility,
          }),
        )

        const res = await fetch("/api/files", { method: "POST", body: form })
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string }
          throw new Error(body.error ?? `Upload failed (${res.status})`)
        }
      }

      setUploadOpen(false)
      setPending([])
      if (inputRef.current) inputRef.current.value = ""
      await refetch()
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  const openEdit = (file: StoredFile) => {
    setEditing(file)
    setEditForm({
      title: file.title ?? file.filename,
      description: file.description ?? "",
      categoryPath: file.categoryPath,
      tags: file.tags.join(", "),
      visibility: file.visibility,
    })
  }

  const saveEdit = async () => {
    if (!editing) return
    await apiMutate(`/api/files/${editing._id}`, "PATCH", {
      title: editForm.title,
      description: editForm.description,
      categoryPath: editForm.categoryPath,
      tags: editForm.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      visibility: editForm.visibility,
    })
    setEditing(null)
    await refetch()
  }

  const remove = async (file: StoredFile) => {
    const ok = await confirm({
      title: "Delete this file?",
      description: `"${file.title ?? file.filename}" will be permanently removed. This cannot be undone.`,
    })
    if (!ok) return
    await apiMutate(`/api/files/${file._id}`, "DELETE")
    await refetch()
  }

  const mine = (file: StoredFile) => file.owner?._id === userId || isAdmin

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-emerald-600">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
        {canUpload && (
          <div>
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => onFilesChosen(e.target.files)}
            />
            <Button onClick={chooseFiles}>
              <Upload className="mr-2 h-4 w-4" />
              Upload files
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search files…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-72">
          <CategoryPicker
            label="Filter by category"
            value={categoryFilter}
            onChange={setCategoryFilter}
            allowAll
          />
        </div>
      </div>

      <AsyncState
        isLoading={isLoading}
        error={error}
        isEmpty={files.length === 0}
        emptyMessage={
          search || categoryFilter.length > 0
            ? "Nothing matches that filter."
            : canUpload
              ? "Nothing here yet — upload your first file."
              : "Nothing has been shared here yet."
        }
        onRetry={refetch}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {files.map((file) => (
            <Card key={file._id} className="overflow-hidden">
              {kindOf(file.contentType) === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/api/files/${file._id}/download?inline=1`}
                  alt={file.title ?? file.filename}
                  className="h-40 w-full cursor-pointer object-cover"
                  onClick={() => setPreviewing(file)}
                />
              ) : (
                <button
                  type="button"
                  className="flex h-40 w-full items-center justify-center bg-muted"
                  onClick={() => setPreviewing(file)}
                >
                  <FileIcon contentType={file.contentType} />
                </button>
              )}

              <CardContent className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium" title={file.title ?? file.filename}>
                      {file.title ?? file.filename}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatBytes(file.size)} · {file.owner?.name ?? "Unknown"}
                    </p>
                  </div>
                  <Badge variant="outline" className="shrink-0 text-xs">
                    {file.visibility}
                  </Badge>
                </div>

                {file.categoryPath.length > 0 && (
                  <p className="truncate text-xs text-muted-foreground">
                    {file.categoryPath.join(" › ")}
                  </p>
                )}

                {file.description && (
                  <p className="line-clamp-2 text-sm text-muted-foreground">{file.description}</p>
                )}

                <div className="flex flex-wrap items-center gap-1 pt-1">
                  <Button variant="outline" size="sm" onClick={() => setPreviewing(file)}>
                    <Eye className="mr-1 h-3.5 w-3.5" />
                    Preview
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href={`/api/files/${file._id}/download`}>
                      <Download className="mr-1 h-3.5 w-3.5" />
                      Download
                    </a>
                  </Button>
                  {mine(file) && (
                    <>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(file)}>
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600"
                        onClick={() => void remove(file)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </AsyncState>

      {/* Upload */}
      <Dialog open={uploadOpen} onOpenChange={(open) => !uploading && setUploadOpen(open)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Upload {pending.length} file{pending.length === 1 ? "" : "s"}
            </DialogTitle>
            <DialogDescription>
              {pending.map((f) => f.name).join(", ")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {pending.length === 1 && (
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={meta.title}
                  onChange={(e) => setMeta((m) => ({ ...m, title: e.target.value }))}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                rows={2}
                value={meta.description}
                onChange={(e) => setMeta((m) => ({ ...m, description: e.target.value }))}
              />
            </div>

            <CategoryPicker
              value={meta.categoryPath}
              onChange={(path) => setMeta((m) => ({ ...m, categoryPath: path }))}
            />

            <div className="space-y-2">
              <Label>Tags</Label>
              <Input
                value={meta.tags}
                onChange={(e) => setMeta((m) => ({ ...m, tags: e.target.value }))}
                placeholder="Comma separated"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {!courseId && (
                <div className="space-y-2">
                  <Label>Class</Label>
                  <Select
                    value={meta.courseId || "none"}
                    onValueChange={(v) =>
                      setMeta((m) => ({ ...m, courseId: v === "none" ? "" : v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not class-specific</SelectItem>
                      {courses.map((c) => (
                        <SelectItem key={c._id} value={c._id}>
                          {c.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Who can see it</Label>
                <Select
                  value={meta.visibility}
                  onValueChange={(v) =>
                    setMeta((m) => ({ ...m, visibility: v as StoredFile["visibility"] }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">Only me</SelectItem>
                    <SelectItem value="course">My class</SelectItem>
                    {isStaff && <SelectItem value="school">Whole school</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)} disabled={uploading}>
              Cancel
            </Button>
            <Button onClick={() => void upload()} disabled={uploading}>
              {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview */}
      <Dialog open={previewing !== null} onOpenChange={(open) => !open && setPreviewing(null)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewing?.title ?? previewing?.filename}</DialogTitle>
            <DialogDescription>
              {previewing && `${formatBytes(previewing.size)} · ${previewing.contentType}`}
            </DialogDescription>
          </DialogHeader>

          {previewing && (
            <div className="space-y-4">
              {kindOf(previewing.contentType) === "image" && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/api/files/${previewing._id}/download?inline=1`}
                  alt={previewing.title ?? previewing.filename}
                  className="max-h-[60vh] w-full rounded object-contain"
                />
              )}
              {kindOf(previewing.contentType) === "video" && (
                <video
                  controls
                  className="w-full rounded bg-black"
                  src={`/api/files/${previewing._id}/download?inline=1`}
                />
              )}
              {kindOf(previewing.contentType) === "audio" && (
                <audio controls className="w-full" src={`/api/files/${previewing._id}/download?inline=1`} />
              )}
              {kindOf(previewing.contentType) === "pdf" && (
                <iframe
                  title={previewing.filename}
                  src={`/api/files/${previewing._id}/download?inline=1`}
                  className="h-[60vh] w-full rounded border"
                />
              )}
              {kindOf(previewing.contentType) === "other" && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  This file type can&apos;t be previewed in the browser — download it to open it.
                </p>
              )}

              {previewing.description && <p className="text-sm">{previewing.description}</p>}
              {previewing.categoryPath.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  Filed under {previewing.categoryPath.join(" › ")}
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            {previewing && (
              <Button asChild>
                <a href={`/api/files/${previewing._id}/download`}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </a>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit metadata */}
      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit file details</DialogTitle>
            <DialogDescription>
              Changes the title, filing and visibility. The file itself stays as it is.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={editForm.title}
                onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                rows={2}
                value={editForm.description}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <CategoryPicker
              value={editForm.categoryPath}
              onChange={(path) => setEditForm((f) => ({ ...f, categoryPath: path }))}
            />
            <div className="space-y-2">
              <Label>Tags</Label>
              <Input
                value={editForm.tags}
                onChange={(e) => setEditForm((f) => ({ ...f, tags: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Who can see it</Label>
              <Select
                value={editForm.visibility}
                onValueChange={(v) =>
                  setEditForm((f) => ({ ...f, visibility: v as StoredFile["visibility"] }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Only me</SelectItem>
                  {editing?.course && <SelectItem value="course">My class</SelectItem>}
                  {isStaff && <SelectItem value="school">Whole school</SelectItem>}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={() => void saveEdit()}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {confirmDialog}
    </div>
  )
}
