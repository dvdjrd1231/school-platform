"use client"

import { useMemo, useRef, useState } from "react"
import {
  BookOpen,
  Download,
  Eye,
  FileText,
  Film,
  Image as ImageIcon,
  Loader2,
  Lock,
  Music,
  Pencil,
  Play,
  Search,
  Trash2,
  Upload,
  Youtube,
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
import { Switch } from "@/components/ui/switch"
import { CategoryPicker } from "@/components/files/category-picker"
import { DocumentViewer, isViewableDocument } from "@/components/files/document-viewer"
import { VideoPlayer } from "@/components/courses/video-player"
import { youtubeThumbnail, youtubeVideoId } from "@/lib/media/youtube"

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
  /** "file" is bytes we store; "youtube" is a link streamed from YouTube. */
  kind?: "file" | "youtube"
  youtubeId?: string
  filename: string
  contentType: string
  size: number
  title?: string
  description?: string
  categoryPath: string[]
  tags: string[]
  visibility: "private" | "course" | "school"
  allowDownload: boolean
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

/**
 * Is this a video the user is trying to upload?
 *
 * Extension as well as MIME type: browsers report video types inconsistently,
 * and a .mov often arrives as application/octet-stream.
 */
const VIDEO_EXTENSIONS =
  /\.(mp4|m4v|mov|webm|avi|mkv|wmv|flv|mpg|mpeg|3gp|ogv)$/i

function isVideoFile(file: File): boolean {
  return file.type.startsWith("video/") || VIDEO_EXTENSIONS.test(file.name)
}

function kindOf(file: Pick<StoredFile, "kind" | "contentType">): "youtube" | "image" | "audio" | "pdf" | "other" {
  if (file.kind === "youtube") return "youtube"
  if (file.contentType.startsWith("image/")) return "image"
  if (file.contentType.startsWith("audio/")) return "audio"
  if (file.contentType === "application/pdf") return "pdf"
  return "other"
}

function FileIcon({ file }: { file: Pick<StoredFile, "kind" | "contentType"> }) {
  const kind = kindOf(file)
  if (kind === "youtube") return <Youtube className="h-5 w-5" />
  if (kind === "image") return <ImageIcon className="h-5 w-5" />
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
    allowDownload: true,
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
    allowDownload: true,
  })
  const [confirm, confirmDialog] = useConfirm()

  // "Add video" dialog. Videos are never uploaded — they are YouTube links, so
  // the hosting, transcoding and bandwidth are YouTube's rather than this
  // server's.
  // Names of video files someone tried to upload, so the prompt can point them
  // at the YouTube route instead of just refusing.
  const [rejectedVideos, setRejectedVideos] = useState<string[]>([])
  const [linkOpen, setLinkOpen] = useState(false)
  const [savingLink, setSavingLink] = useState(false)
  const [linkError, setLinkError] = useState("")
  const [link, setLink] = useState({
    url: "",
    title: "",
    description: "",
    categoryPath: [] as string[],
    tags: "",
    visibility: defaultVisibility,
    courseId: courseId ?? "",
  })

  const linkVideoId = youtubeVideoId(link.url)
  const linkInvalid = link.url.trim().length > 0 && !linkVideoId

  const addLink = async () => {
    if (!linkVideoId) {
      setLinkError("Paste a YouTube link — the address from the video's page or its Share button.")
      return
    }

    setSavingLink(true)
    setLinkError("")
    try {
      await apiMutate("/api/files", "POST", {
        context,
        url: link.url.trim(),
        courseId: link.courseId || undefined,
        title: link.title.trim() || undefined,
        description: link.description.trim() || undefined,
        categoryPath: link.categoryPath,
        tags: link.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        visibility: link.visibility,
      })

      setLinkOpen(false)
      setLink((l) => ({ ...l, url: "", title: "", description: "", tags: "" }))
      await refetch()
    } catch (err) {
      setLinkError(err instanceof Error ? err.message : "Could not add the video")
    } finally {
      setSavingLink(false)
    }
  }

  const chooseFiles = () => inputRef.current?.click()

  const onFilesChosen = (list: FileList | null) => {
    if (!list || list.length === 0) return
    const chosen = Array.from(list)

    // Videos go to YouTube, not here. Caught before the upload starts so nobody
    // waits for a 400 MB file to transfer only to be told no — the server
    // refuses it too, since this check is only a courtesy.
    const videos = chosen.filter(isVideoFile)
    if (videos.length > 0) {
      setUploadError("")
      setPending([])
      if (inputRef.current) inputRef.current.value = ""
      setRejectedVideos(videos.map((f) => f.name))
      return
    }

    setPending(chosen)
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
            allowDownload: meta.allowDownload,
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
      allowDownload: file.allowDownload !== false,
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
      allowDownload: editForm.allowDownload,
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
              // A hint to the file picker, not a restriction — a determined
              // selection still reaches onFilesChosen, and the server checks
              // again regardless.
              accept="image/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip"
              className="hidden"
              onChange={(e) => onFilesChosen(e.target.files)}
            />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setLinkOpen(true)}>
                <Youtube className="mr-2 h-4 w-4" />
                Add video
              </Button>
              <Button onClick={chooseFiles}>
                <Upload className="mr-2 h-4 w-4" />
                Upload files
              </Button>
            </div>
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
              ? "Nothing here yet — upload a file, or add a video from YouTube."
              : "Nothing has been shared here yet."
        }
        onRetry={refetch}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {files.map((file) => (
            <Card key={file._id} className="overflow-hidden">
              {kindOf(file) === "youtube" && file.youtubeId ? (
                <button
                  type="button"
                  className="group relative flex h-40 w-full items-center justify-center bg-black"
                  onClick={() => setPreviewing(file)}
                  aria-label={`Play ${file.title ?? file.filename}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={youtubeThumbnail(file.youtubeId)}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-60"
                  />
                  <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 shadow-lg transition-transform group-hover:scale-110">
                    <Play className="ml-0.5 h-6 w-6 text-white" fill="currentColor" />
                  </span>
                </button>
              ) : kindOf(file) === "image" ? (
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
                  <FileIcon file={file} />
                </button>
              )}

              <CardContent className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium" title={file.title ?? file.filename}>
                      {file.title ?? file.filename}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {kindOf(file) === "youtube" ? "YouTube" : formatBytes(file.size)} ·{" "}
                      {file.owner?.name ?? "Unknown"}
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
                    {kindOf(file) === "youtube" ? (
                      <>
                        <Play className="mr-1 h-3.5 w-3.5" />
                        Watch
                      </>
                    ) : isViewableDocument(file.contentType) ? (
                      <>
                        <BookOpen className="mr-1 h-3.5 w-3.5" />
                        Read
                      </>
                    ) : (
                      <>
                        <Eye className="mr-1 h-3.5 w-3.5" />
                        Preview
                      </>
                    )}
                  </Button>
                  {kindOf(file) === "youtube" ? null : file.allowDownload !== false ? (
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/api/files/${file._id}/download`}>
                        <Download className="mr-1 h-3.5 w-3.5" />
                        Download
                      </a>
                    </Button>
                  ) : (
                    <Badge variant="outline" className="flex items-center gap-1 text-xs">
                      <Lock className="h-3 w-3" />
                      View only
                    </Badge>
                  )}
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

            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <Label>Allow downloading</Label>
                <p className="text-xs text-muted-foreground">
                  Turn this off for material that may be read online but not taken away. PDFs
                  stay readable in the browser either way.
                </p>
              </div>
              <Switch
                checked={meta.allowDownload}
                onCheckedChange={(allowDownload) => setMeta((m) => ({ ...m, allowDownload }))}
              />
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
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{previewing?.title ?? previewing?.filename}</DialogTitle>
            <DialogDescription>
              {previewing &&
                (kindOf(previewing) === "youtube"
                  ? "Streamed from YouTube"
                  : `${formatBytes(previewing.size)} · ${previewing.contentType}`)}
            </DialogDescription>
          </DialogHeader>

          {previewing && (
            <div className="space-y-4">
              {kindOf(previewing) === "youtube" && previewing.youtubeId && (
                <VideoPlayer url={previewing.youtubeId} title={previewing.title ?? previewing.filename} />
              )}
              {kindOf(previewing) === "image" && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/api/files/${previewing._id}/download?inline=1`}
                  alt={previewing.title ?? previewing.filename}
                  className="max-h-[60vh] w-full rounded object-contain"
                />
              )}
              {kindOf(previewing) === "audio" && (
                <audio controls className="w-full" src={`/api/files/${previewing._id}/download?inline=1`} />
              )}
              {kindOf(previewing) === "pdf" && (
                <DocumentViewer
                  fileId={previewing._id}
                  filename={previewing.filename}
                  contentType={previewing.contentType}
                  allowDownload={previewing.allowDownload !== false}
                  height="65vh"
                />
              )}
              {kindOf(previewing) === "other" && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  {previewing.allowDownload === false
                    ? "This file type can't be read in the browser, and it is view-only."
                    : "This file type can't be previewed in the browser — download it to open it."}
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
            {previewing &&
              previewing.allowDownload !== false &&
              kindOf(previewing) !== "pdf" && (
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

            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <Label>Allow downloading</Label>
                <p className="text-xs text-muted-foreground">
                  Turn this off for material that may be read online but not taken away. PDFs
                  stay readable in the browser either way.
                </p>
              </div>
              <Switch
                checked={editForm.allowDownload}
                onCheckedChange={(allowDownload) => setEditForm((f) => ({ ...f, allowDownload }))}
              />
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

      {/* Someone picked a video file for upload */}
      <Dialog
        open={rejectedVideos.length > 0}
        onOpenChange={(open) => !open && setRejectedVideos([])}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Videos are added from YouTube</DialogTitle>
            <DialogDescription>
              This site doesn&apos;t host video files. Upload the video to YouTube, then paste its
              link here — YouTube handles the storage, the streaming and the bandwidth, and it
              plays properly on slow connections and phones.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-md border bg-muted/40 p-3">
            <p className="mb-1 text-xs font-medium text-muted-foreground">Not added:</p>
            <ul className="space-y-1 text-sm">
              {rejectedVideos.map((name) => (
                <li key={name} className="truncate">
                  {name}
                </li>
              ))}
            </ul>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectedVideos([])}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setRejectedVideos([])
                setLinkOpen(true)
              }}
            >
              <Youtube className="mr-2 h-4 w-4" />
              Add a YouTube link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add a YouTube video */}
      <Dialog open={linkOpen} onOpenChange={(open) => !savingLink && setLinkOpen(open)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add a video</DialogTitle>
            <DialogDescription>
              Videos are streamed from YouTube rather than uploaded here, so YouTube handles the
              hosting and the bandwidth. Upload the video to YouTube first, then paste its link.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="yt-url">YouTube link</Label>
              <Input
                id="yt-url"
                value={link.url}
                onChange={(e) => setLink((l) => ({ ...l, url: e.target.value }))}
                placeholder="https://www.youtube.com/watch?v=..."
                aria-invalid={linkInvalid}
              />
              {linkInvalid && (
                <p className="text-xs text-red-600">
                  That isn&apos;t a YouTube link. Watch, share, embed and Shorts links all work.
                </p>
              )}
            </div>

            {linkVideoId && (
              <div className="space-y-2">
                <Label>Preview</Label>
                <VideoPlayer url={linkVideoId} title="Video preview" />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="yt-title">Title</Label>
              <Input
                id="yt-title"
                value={link.title}
                onChange={(e) => setLink((l) => ({ ...l, title: e.target.value }))}
                placeholder="What this video is"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="yt-description">Description</Label>
              <Textarea
                id="yt-description"
                rows={2}
                value={link.description}
                onChange={(e) => setLink((l) => ({ ...l, description: e.target.value }))}
              />
            </div>

            <CategoryPicker
              value={link.categoryPath}
              onChange={(categoryPath) => setLink((l) => ({ ...l, categoryPath }))}
            />

            <div className="space-y-2">
              <Label htmlFor="yt-tags">Tags</Label>
              <Input
                id="yt-tags"
                value={link.tags}
                onChange={(e) => setLink((l) => ({ ...l, tags: e.target.value }))}
                placeholder="Comma separated"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {!courseId && (
                <div className="space-y-2">
                  <Label>Class</Label>
                  <Select
                    value={link.courseId || "none"}
                    onValueChange={(v) =>
                      setLink((l) => ({ ...l, courseId: v === "none" ? "" : v }))
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
                  value={link.visibility}
                  onValueChange={(v) =>
                    setLink((l) => ({ ...l, visibility: v as StoredFile["visibility"] }))
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

            {linkError && <p className="text-sm text-red-600">{linkError}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkOpen(false)} disabled={savingLink}>
              Cancel
            </Button>
            <Button onClick={() => void addLink()} disabled={savingLink || !linkVideoId}>
              {savingLink && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add video
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {confirmDialog}
    </div>
  )
}
