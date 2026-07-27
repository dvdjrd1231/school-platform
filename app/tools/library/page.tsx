import { FileLibrary } from "@/components/files/file-library"

/**
 * The digital library: school-wide teaching resources.
 *
 * Only teachers and admins may add to it — for a student it's read-and-download
 * only. Uploads default to school-wide because that's the point of the library.
 */
export default function DigitalLibraryPage() {
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
