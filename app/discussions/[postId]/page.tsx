import { Sidebar } from "@/components/layout/sidebar"
import { DiscussionPost } from "@/components/discussions/discussion-post"

interface DiscussionPostPageProps {
  params: {
    postId: string
  }
}

export default function DiscussionPostPage({ params }: DiscussionPostPageProps) {
  return (
    <div className="flex w-full">
      <Sidebar />
      <div className="flex-1">
        <DiscussionPost postId={params.postId} />
      </div>
    </div>
  )
}
