import { Suspense } from "react"
import { DiscussionPost } from "@/components/discussions/discussion-post"

interface DiscussionPageProps {
  params: {
    id: string
  }
}

export default function DiscussionPage({ params }: DiscussionPageProps) {
  return (
    <div className="container mx-auto p-6">
      <Suspense fallback={<div>Loading discussion...</div>}>
        <DiscussionPost postId={params.id} />
      </Suspense>
    </div>
  )
}
