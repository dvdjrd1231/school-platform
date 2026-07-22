import { Suspense } from "react"
import { DiscussionPost } from "@/components/discussions/discussion-post"

interface DiscussionPageProps {
  params: Promise<{ id: string }>
}

export default async function DiscussionPage({ params }: DiscussionPageProps) {
  const { id } = await params

  return (
    <div className="container mx-auto p-6">
      <Suspense fallback={<div>Loading discussion...</div>}>
        <DiscussionPost postId={id} />
      </Suspense>
    </div>
  )
}
