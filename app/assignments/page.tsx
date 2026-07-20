import { Sidebar } from "@/components/layout/sidebar"
import { AssignmentList } from "@/components/assignments/assignment-list"

export default function AssignmentsPage() {
  return (
    <div className="flex w-full">
      <Sidebar />
      <div className="flex-1">
        <AssignmentList />
      </div>
    </div>
  )
}
