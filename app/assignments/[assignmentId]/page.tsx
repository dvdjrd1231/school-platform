import { Sidebar } from "@/components/layout/sidebar"
import { AssignmentDetail } from "@/components/assignments/assignment-detail"

interface AssignmentDetailPageProps {
  params: {
    assignmentId: string
  }
}

export default function AssignmentDetailPage({ params }: AssignmentDetailPageProps) {
  return (
    <div className="flex w-full">
      <Sidebar />
      <div className="flex-1">
        <AssignmentDetail assignmentId={params.assignmentId} />
      </div>
    </div>
  )
}
