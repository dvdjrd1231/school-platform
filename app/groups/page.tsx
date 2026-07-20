"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Users, Plus, MessageCircle, Calendar, Settings, UserPlus, Crown, Clock } from "lucide-react"

export default function GroupsPage() {
  const [searchTerm, setSearchTerm] = useState("")

  const myGroups = [
    {
      id: 1,
      name: "Mathematics Study Group",
      subject: "Mathematics",
      members: 12,
      role: "Member",
      lastActivity: "2 hours ago",
      description: "Weekly study sessions for Mathematics 101",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      id: 2,
      name: "Biology Lab Partners",
      subject: "Biology",
      members: 8,
      role: "Admin",
      lastActivity: "1 day ago",
      description: "Collaboration group for biology lab assignments",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      id: 3,
      name: "English Literature Discussion",
      subject: "English",
      members: 15,
      role: "Member",
      lastActivity: "3 days ago",
      description: "Discuss readings and share insights",
      avatar: "/placeholder.svg?height=40&width=40",
    },
  ]

  const availableGroups = [
    {
      id: 4,
      name: "Chemistry Help Desk",
      subject: "Chemistry",
      members: 24,
      description: "Get help with chemistry problems and concepts",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      id: 5,
      name: "History Debate Club",
      subject: "History",
      members: 18,
      description: "Engage in historical debates and discussions",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      id: 6,
      name: "Physics Problem Solvers",
      subject: "Physics",
      members: 16,
      description: "Collaborative problem-solving for physics courses",
      avatar: "/placeholder.svg?height=40&width=40",
    },
  ]

  const recentActivity = [
    {
      group: "Mathematics Study Group",
      user: "Sarah Johnson",
      action: "shared a study guide",
      time: "2 hours ago",
    },
    {
      group: "Biology Lab Partners",
      user: "Michael Chen",
      action: "posted lab results",
      time: "5 hours ago",
    },
    {
      group: "English Literature Discussion",
      user: "Emma Wilson",
      action: "started a discussion about Hamlet",
      time: "1 day ago",
    },
  ]

  const getRoleIcon = (role: string) => {
    return role === "Admin" ? <Crown className="h-4 w-4 text-yellow-600" /> : null
  }

  const getRoleBadge = (role: string) => {
    return role === "Admin" ? (
      <Badge className="bg-yellow-100 text-yellow-800">Admin</Badge>
    ) : (
      <Badge variant="outline">Member</Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Study Groups</h1>
          <p className="text-gray-600 mt-1">Collaborate with classmates and join study groups</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4 mr-2" />
          Create Group
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Groups</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Active memberships</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">35</div>
            <p className="text-xs text-muted-foreground">Across all groups</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">127</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Study Sessions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">Scheduled this month</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="my-groups" className="space-y-6">
        <TabsList>
          <TabsTrigger value="my-groups">My Groups</TabsTrigger>
          <TabsTrigger value="discover">Discover</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="my-groups">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myGroups.map((group) => (
              <Card key={group.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={group.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{group.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{group.name}</CardTitle>
                      <CardDescription>{group.subject}</CardDescription>
                    </div>
                    {getRoleIcon(group.role)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600">{group.description}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{group.members} members</span>
                    </div>
                    {getRoleBadge(group.role)}
                  </div>

                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    Last activity {group.lastActivity}
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                      <MessageCircle className="h-3 w-3 mr-1" />
                      Chat
                    </Button>
                    <Button size="sm" variant="outline">
                      <Settings className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="discover">
          <Card>
            <CardHeader>
              <CardTitle>Discover Groups</CardTitle>
              <CardDescription>Find and join study groups for your subjects</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search groups..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableGroups.map((group) => (
                  <Card key={group.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={group.avatar || "/placeholder.svg"} />
                          <AvatarFallback>{group.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg truncate">{group.name}</CardTitle>
                          <CardDescription>{group.subject}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-gray-600">{group.description}</p>

                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{group.members} members</span>
                      </div>

                      <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Join Group
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates from your study groups</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {activity.user
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm">
                        <span className="font-medium">{activity.user}</span> {activity.action} in{" "}
                        <span className="font-medium">{activity.group}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                        <Clock className="h-3 w-3" />
                        {activity.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
