import { Sidebar } from "@/components/layout/sidebar"
import { AssignmentDetail } from "@/components/assignments/assignment-detail"

interface AssignmentDetailPageProps {
  params: Promise<{ assignmentId: string }>
}

export default async function AssignmentDetailPage({ params }: AssignmentDetailPageProps) {
  const { assignmentId } = await params

  return (
    <div className="flex w-full">
      <Sidebar />
      <div className="flex-1">
        <AssignmentDetail assignmentId={assignmentId} />
      </div>
    </div>
  )
}
