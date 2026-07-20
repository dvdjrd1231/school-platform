import { Suspense } from "react"
import { AssignmentDetail } from "@/components/assignments/assignment-detail"

interface AssignmentPageProps {
  params: {
    id: string
  }
}

export default function AssignmentPage({ params }: AssignmentPageProps) {
  return (
    <div className="container mx-auto p-6">
      <Suspense fallback={<div>Loading assignment...</div>}>
        <AssignmentDetail assignmentId={params.id} />
      </Suspense>
    </div>
  )
}
