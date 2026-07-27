import { FileLibrary } from "@/components/files/file-library"

/**
 * My Documents — the student's own files.
 *
 * Report cards filed by teachers appear under Progress Reports rather than
 * here, since those aren't the student's to edit or delete.
 */
export default function DocumentsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <FileLibrary
        context="media"
        title="My documents"
        description="Your personal and academic files. Upload, preview, download or remove them."
      />
    </div>
  )
}
