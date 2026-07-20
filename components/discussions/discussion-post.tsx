"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  ArrowLeft,
  MessageSquare,
  ThumbsUp,
  Reply,
  ChevronDown,
  ChevronUp,
  Pin,
  Flag,
  MoreHorizontal,
  Send,
  Eye,
  EyeOff,
} from "lucide-react"
import Link from "next/link"

interface DiscussionPostProps {
  postId: string
}

const postData = {
  id: 1,
  title: "Chapter 3: Algebra Fundamentals - Questions & Discussion",
  description:
    "Let's discuss the key concepts from Chapter 3. If you're having trouble with any of the algebra problems, post them here and we'll work through them together. Remember to show your work!",
  author: "Dr. Sarah Johnson",
  authorRole: "Teacher",
  createdAt: "1 day ago",
  category: "Course Content",
  views: 89,
  likes: 12,
  isPinned: false,
}

const replies = [
  {
    id: 1,
    content: "I'm having trouble with problem 15 from the textbook. Can someone help me understand the first step?",
    author: "Alex Chen",
    authorRole: "Student",
    createdAt: "18 hours ago",
    likes: 3,
    replies: [
      {
        id: 2,
        content: "The first step is to isolate the variable on one side. What specific part are you stuck on?",
        author: "Dr. Sarah Johnson",
        authorRole: "Teacher",
        createdAt: "17 hours ago",
        likes: 5,
        isTeacherFeedback: true,
        replies: [
          {
            id: 3,
            content: "I think I understand now! I was forgetting to distribute the coefficient. Thank you!",
            author: "Alex Chen",
            authorRole: "Student",
            createdAt: "16 hours ago",
            likes: 2,
            replies: [],
          },
        ],
      },
    ],
  },
  {
    id: 4,
    content: "This chapter is really challenging. Are there any additional practice resources you'd recommend?",
    author: "Maria Rodriguez",
    authorRole: "Student",
    createdAt: "12 hours ago",
    likes: 7,
    replies: [
      {
        id: 5,
        content: "I've uploaded some extra practice problems to the course materials section. Check them out!",
        author: "Dr. Sarah Johnson",
        authorRole: "Teacher",
        createdAt: "11 hours ago",
        likes: 8,
        isTeacherFeedback: true,
        replies: [],
      },
      {
        id: 6,
        content: "Khan Academy also has great algebra practice problems. I found them really helpful!",
        author: "John Smith",
        authorRole: "Student",
        createdAt: "10 hours ago",
        likes: 4,
        replies: [],
      },
    ],
  },
]

export function DiscussionPost({ postId }: DiscussionPostProps) {
  const [newReply, setNewReply] = useState("")
  const [replyingTo, setReplyingTo] = useState<number | null>(null)
  const [expandedReplies, setExpandedReplies] = useState<number[]>([1, 4])
  const [hiddenFeedback, setHiddenFeedback] = useState<number[]>([])

  const toggleReplyExpansion = (replyId: number) => {
    setExpandedReplies((prev) => (prev.includes(replyId) ? prev.filter((id) => id !== replyId) : [...prev, replyId]))
  }

  const toggleFeedbackVisibility = (replyId: number) => {
    setHiddenFeedback((prev) => (prev.includes(replyId) ? prev.filter((id) => id !== replyId) : [...prev, replyId]))
  }

  const renderReply = (reply: any, depth = 0) => {
    const isExpanded = expandedReplies.includes(reply.id)
    const isFeedbackHidden = hiddenFeedback.includes(reply.id)
    const maxDepth = 3

    return (
      <div key={reply.id} className={`${depth > 0 ? "ml-8 border-l-2 border-muted pl-4" : ""}`}>
        <Card className={`mb-4 ${reply.isTeacherFeedback ? "border-primary/50 bg-primary/5" : ""}`}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={`/abstract-geometric-shapes.png?height=32&width=32&query=${reply.author}`} />
                <AvatarFallback className="text-xs">
                  {reply.author
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-sm">{reply.author}</span>
                  <Badge variant={reply.authorRole === "Teacher" ? "default" : "secondary"} className="text-xs">
                    {reply.authorRole}
                  </Badge>
                  {reply.isTeacherFeedback && (
                    <Badge variant="outline" className="text-xs text-primary">
                      Teacher Feedback
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">{reply.createdAt}</span>
                </div>

                {reply.isTeacherFeedback && (
                  <div className="flex items-center gap-2 mb-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleFeedbackVisibility(reply.id)}
                      className="h-6 px-2 text-xs"
                    >
                      {isFeedbackHidden ? (
                        <>
                          <Eye className="h-3 w-3 mr-1" />
                          Show Feedback
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3 w-3 mr-1" />
                          Hide Feedback
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {(!reply.isTeacherFeedback || !isFeedbackHidden) && (
                  <>
                    <p className="text-sm mb-3 text-pretty">{reply.content}</p>

                    <div className="flex items-center gap-4">
                      <Button variant="ghost" size="sm" className="h-6 px-2">
                        <ThumbsUp className="h-3 w-3 mr-1" />
                        {reply.likes}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2"
                        onClick={() => setReplyingTo(replyingTo === reply.id ? null : reply.id)}
                      >
                        <Reply className="h-3 w-3 mr-1" />
                        Reply
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 px-2">
                        <Flag className="h-3 w-3 mr-1" />
                        Report
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {replyingTo === reply.id && (
              <div className="mt-4 ml-11">
                <Textarea
                  placeholder="Write your reply..."
                  value={newReply}
                  onChange={(e) => setNewReply(e.target.value)}
                  className="mb-2"
                />
                <div className="flex gap-2">
                  <Button size="sm">
                    <Send className="h-3 w-3 mr-1" />
                    Post Reply
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setReplyingTo(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {reply.replies && reply.replies.length > 0 && depth < maxDepth && (
          <Collapsible open={isExpanded} onOpenChange={() => toggleReplyExpansion(reply.id)}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="mb-2 ml-8">
                {isExpanded ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
                {reply.replies.length} {reply.replies.length === 1 ? "reply" : "replies"}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              {reply.replies.map((nestedReply: any) => renderReply(nestedReply, depth + 1))}
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    )
  }

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/discussions">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Discussions
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          {postData.isPinned && <Pin className="h-4 w-4 text-primary" />}
          <Badge variant="outline">{postData.category}</Badge>
        </div>
      </div>

      {/* Main Post */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl mb-2 text-balance">{postData.title}</CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={`/abstract-geometric-shapes.png?height=24&width=24&query=${postData.author}`} />
                    <AvatarFallback className="text-xs">
                      {postData.author
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-foreground">{postData.author}</span>
                  <Badge variant="default" className="text-xs">
                    {postData.authorRole}
                  </Badge>
                </div>
                <span>{postData.createdAt}</span>
                <span>{postData.views} views</span>
              </div>
            </div>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4 text-pretty">{postData.description}</p>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm">
              <ThumbsUp className="h-4 w-4 mr-2" />
              {postData.likes}
            </Button>
            <Button variant="ghost" size="sm">
              <MessageSquare className="h-4 w-4 mr-2" />
              {replies.length} Replies
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Start a Thread */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Start a Thread</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Share your thoughts, ask a question, or start a discussion..."
            value={newReply}
            onChange={(e) => setNewReply(e.target.value)}
            className="mb-4"
          />
          <Button>
            <Send className="h-4 w-4 mr-2" />
            Post Reply
          </Button>
        </CardContent>
      </Card>

      {/* Replies */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Replies ({replies.length})</h2>
        {replies.map((reply) => renderReply(reply))}
      </div>
    </div>
  )
}
