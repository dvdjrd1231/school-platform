import { FileLibrary } from "@/components/files/file-library"

export default function MyMediaPage() {
  return (
    <div className="container mx-auto p-6">
      <FileLibrary
        context="media"
        title="My Media"
        description="Your own files. Upload, preview, download or delete them, and file them by category."
      />
    </div>
  )
}
