"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { MessageSquare, Search, Pin, Users, Clock, ChevronRight, Plus, Filter } from "lucide-react"
import Link from "next/link"
import { getDiscussionPosts } from "@/lib/database"
import { useRouter } from "next/navigation"
import { useRole } from "@/components/context/role-context"

const categories = ["All", "General", "Course Content", "Homework Help", "Study Groups", "Announcements"]

export function DiscussionBoard() {
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const { isTeacher, isAdmin } = useRole()

  const discussionPosts = getDiscussionPosts()

  const filteredPosts = discussionPosts.filter((post) => {
    const matchesCategory = selectedCategory === "All" || post.category === selectedCategory
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const handleLoadMore = async () => {
    setIsLoadingMore(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsLoadingMore(false)
  }

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-balance">Discussion Board</h1>
          <p className="text-muted-foreground">Mathematics - Grade 10 Forum</p>
        </div>
        {(isTeacher || isAdmin) && (
          <Button onClick={() => router.push("/classrooms/discussions/new")}>
            <Plus className="h-4 w-4 mr-2" />
            New Discussion
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search discussions..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <div className="flex gap-1">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Discussion Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">{discussionPosts.length} Discussions</p>
                <p className="text-xs text-muted-foreground">Total topics</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">28 Participants</p>
                <p className="text-xs text-muted-foreground">Active members</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">93 Replies</p>
                <p className="text-xs text-muted-foreground">Total responses</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">30 min ago</p>
                <p className="text-xs text-muted-foreground">Last activity</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Discussion Posts */}
      <div className="space-y-4">
        {filteredPosts.map((post) => (
          <Card key={post.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={`/abstract-geometric-shapes.png?height=48&width=48&query=${post.author}`} />
                  <AvatarFallback>
                    {post.author
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {post.isPinned && <Pin className="h-4 w-4 text-primary" />}
                      <Link href={`/classrooms/discussions/${post.id}`}>
                        <h3 className="text-lg font-semibold hover:text-primary cursor-pointer text-balance">
                          {post.title}
                        </h3>
                      </Link>
                    </div>
                    <Badge variant={post.authorRole === "Teacher" ? "default" : "secondary"}>{post.category}</Badge>
                  </div>

                  <p className="text-muted-foreground mb-4 text-pretty">{post.description}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-foreground">{post.author}</span>
                        <Badge variant="outline" className="text-xs">
                          {post.authorRole}
                        </Badge>
                      </div>
                      <span>{post.createdAt}</span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        <span>{post.replies} replies</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{post.views} views</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>Last: {post.lastActivity}</span>
                      </div>
                      <Link href={`/classrooms/discussions/${post.id}`}>
                        <Button variant="ghost" size="sm">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Load More */}
      <div className="text-center">
        <Button variant="outline" className="bg-transparent" onClick={handleLoadMore} disabled={isLoadingMore}>
          {isLoadingMore ? "Loading..." : "Load More Discussions"}
        </Button>
      </div>
    </div>
  )
}
