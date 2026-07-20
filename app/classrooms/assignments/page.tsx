import { Suspense } from "react"
import { AssignmentList } from "@/components/assignments/assignment-list"

export default function ClassroomAssignmentsPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Assignments</h1>
        <p className="text-gray-600 mt-2">View and submit your assignments</p>
      </div>

      <Suspense fallback={<div>Loading assignments...</div>}>
        <AssignmentList />
      </Suspense>
    </div>
  )
}
