import { FileLibrary } from "@/components/files/file-library"

/** Same digital library as /tools/library — this is the top-level entry to it. */
export default function LibraryPage() {
  return (
    <div className="container mx-auto p-6">
      <FileLibrary
        context="library"
        title="Digital Library"
        description="Textbooks, worksheets and reference material for the whole school"
        defaultVisibility="school"
        uploadRequiresStaff
      />
    </div>
  )
}
