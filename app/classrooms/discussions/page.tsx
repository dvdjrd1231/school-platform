import { Suspense } from "react"
import { DiscussionBoard } from "@/components/discussions/discussion-board"

export default function ClassroomDiscussionsPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Discussions</h1>
        <p className="text-gray-600 mt-2">Participate in class discussions and forums</p>
      </div>

      <Suspense fallback={<div>Loading discussions...</div>}>
        <DiscussionBoard />
      </Suspense>
    </div>
  )
}
