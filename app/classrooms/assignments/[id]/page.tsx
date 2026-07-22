import { Suspense } from "react"
import { AssignmentDetail } from "@/components/assignments/assignment-detail"

// Next.js 15 delivers route params as a Promise; reading them synchronously
// leaves `id` undefined at runtime.
interface AssignmentPageProps {
  params: Promise<{ id: string }>
}

export default async function AssignmentPage({ params }: AssignmentPageProps) {
  const { id } = await params

  return (
    <div className="container mx-auto p-6">
      <Suspense fallback={<div>Loading assignment...</div>}>
        <AssignmentDetail assignmentId={id} />
      </Suspense>
    </div>
  )
}
