import { Sidebar } from "@/components/layout/sidebar"
import { DiscussionPost } from "@/components/discussions/discussion-post"

interface DiscussionPostPageProps {
  params: Promise<{ postId: string }>
}

export default async function DiscussionPostPage({ params }: DiscussionPostPageProps) {
  const { postId } = await params

  return (
    <div className="flex w-full">
      <Sidebar />
      <div className="flex-1">
        <DiscussionPost postId={postId} />
      </div>
    </div>
  )
}
