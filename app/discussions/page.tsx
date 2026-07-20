import { Sidebar } from "@/components/layout/sidebar"
import { DiscussionBoard } from "@/components/discussions/discussion-board"

export default function DiscussionsPage() {
  return (
    <div className="flex w-full">
      <Sidebar />
      <div className="flex-1">
        <DiscussionBoard />
      </div>
    </div>
  )
}
