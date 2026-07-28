"use client"

import { useState } from "react"
import { AlertCircle, Download, ExternalLink, Loader2, Lock, Maximize2 } from "lucide-react"

import { Button } from "@/components/ui/button"

interface Props {
  fileId: string
  filename: string
  contentType: string
  /** When false, only the online reader is offered. */
  allowDownload: boolean
  /** Taller frame for the dedicated reader page than for the preview dialog. */
  height?: string
}

export function isViewableDocument(contentType: string): boolean {
  return contentType === "application/pdf"
}

/**
 * Read a document in the browser.
 *
 * PDFs render in the browser's own viewer through an <iframe> pointed at the
 * inline download route. That needs no PDF library — every browser the school
 * will use has one built in, and shipping a renderer would add megabytes to
 * the bundle to reproduce what is already there.
 *
 * For a view-only item the toolbar asks the browser to hide its download and
 * print buttons. That is a courtesy, not a control: the real enforcement is the
 * server refusing the download URL. Anyone who can read a document can
 * screenshot it, and it would be dishonest to imply otherwise — what this stops
 * is casual redistribution, which is what the licensing usually turns on.
 */
export function DocumentViewer({
  fileId,
  filename,
  contentType,
  allowDownload,
  height = "70vh",
}: Props) {
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  const viewUrl = `/api/files/${fileId}/download?inline=1`
  // Browser-viewer hints. Ignored by some viewers, which is why they're a hint.
  const framedUrl = allowDownload ? viewUrl : `${viewUrl}#toolbar=0&navpanes=0`

  if (!isViewableDocument(contentType)) {
    return (
      <div className="rounded-md border bg-muted/40 p-6 text-center text-sm">
        <p className="mb-3 text-muted-foreground">
          This file type can&apos;t be read in the browser.
        </p>
        {allowDownload ? (
          <Button asChild>
            <a href={`/api/files/${fileId}/download`}>
              <Download className="mr-2 h-4 w-4" />
              Download to open it
            </a>
          </Button>
        ) : (
          <p className="flex items-center justify-center gap-2 text-muted-foreground">
            <Lock className="h-4 w-4" />
            This item is view-only, and can&apos;t be opened in this format.
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="relative overflow-hidden rounded-md border bg-muted/20" style={{ height }}>
        {loading && !failed && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading document…
          </div>
        )}

        {failed ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
            <AlertCircle className="h-8 w-8 text-amber-600" />
            <p className="text-sm text-muted-foreground">
              Your browser couldn&apos;t display this document inline.
            </p>
            <Button variant="outline" asChild>
              <a href={viewUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Open in a new tab
              </a>
            </Button>
          </div>
        ) : (
          <iframe
            src={framedUrl}
            title={filename}
            className="h-full w-full"
            onLoad={() => setLoading(false)}
            onError={() => {
              setLoading(false)
              setFailed(true)
            }}
          />
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {allowDownload ? (
            filename
          ) : (
            <span className="flex items-center gap-1">
              <Lock className="h-3 w-3" />
              View-only — this item can be read here but not downloaded.
            </span>
          )}
        </p>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href={viewUrl} target="_blank" rel="noreferrer">
              <Maximize2 className="mr-2 h-4 w-4" />
              Full screen
            </a>
          </Button>
          {allowDownload && (
            <Button size="sm" asChild>
              <a href={`/api/files/${fileId}/download`}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
