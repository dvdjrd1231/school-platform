"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, BookOpen, Download, Eye, Star, Clock, FileText, Video, ImageIcon, Archive, Music } from "lucide-react"

export default function LibraryPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterSubject, setFilterSubject] = useState("all")

  const resources = [
    {
      id: 1,
      title: "Algebra Fundamentals Textbook",
      type: "PDF",
      subject: "Mathematics",
      author: "Dr. Sarah Johnson",
      size: "15.2 MB",
      downloads: 1247,
      rating: 4.8,
      description: "Comprehensive guide to algebraic concepts and problem-solving techniques",
      thumbnail: "/placeholder.svg?height=100&width=80",
    },
    {
      id: 2,
      title: "Shakespeare's Complete Works",
      type: "PDF",
      subject: "English",
      author: "William Shakespeare",
      size: "8.7 MB",
      downloads: 892,
      rating: 4.9,
      description: "Complete collection of Shakespeare's plays and sonnets",
      thumbnail: "/placeholder.svg?height=100&width=80",
    },
    {
      id: 3,
      title: "Cell Biology Video Series",
      type: "Video",
      subject: "Biology",
      author: "Dr. Emily Davis",
      size: "245 MB",
      downloads: 634,
      rating: 4.7,
      description: "Interactive video lessons on cellular structure and function",
      thumbnail: "/placeholder.svg?height=100&width=80",
    },
    {
      id: 4,
      title: "World War II Documentary",
      type: "Video",
      subject: "History",
      author: "History Channel",
      size: "1.2 GB",
      downloads: 456,
      rating: 4.6,
      description: "Comprehensive documentary covering major WWII events",
      thumbnail: "/placeholder.svg?height=100&width=80",
    },
    {
      id: 5,
      title: "Chemistry Lab Manual",
      type: "PDF",
      subject: "Chemistry",
      author: "Dr. Lisa Anderson",
      size: "12.4 MB",
      downloads: 789,
      rating: 4.5,
      description: "Step-by-step laboratory procedures and safety guidelines",
      thumbnail: "/placeholder.svg?height=100&width=80",
    },
    {
      id: 6,
      title: "Classical Music Collection",
      type: "Audio",
      subject: "Music",
      author: "Various Artists",
      size: "156 MB",
      downloads: 234,
      rating: 4.4,
      description: "Curated collection of classical compositions for music appreciation",
      thumbnail: "/placeholder.svg?height=100&width=80",
    },
  ]

  const filteredResources = resources.filter((resource) => {
    const matchesSearch =
      resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === "all" || resource.type.toLowerCase() === filterType.toLowerCase()
    const matchesSubject = filterSubject === "all" || resource.subject === filterSubject
    return matchesSearch && matchesType && matchesSubject
  })

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "pdf":
        return <FileText className="h-5 w-5 text-red-600" />
      case "video":
        return <Video className="h-5 w-5 text-blue-600" />
      case "audio":
        return <Music className="h-5 w-5 text-green-600" />
      case "image":
        return <ImageIcon className="h-5 w-5 text-purple-600" />
      default:
        return <Archive className="h-5 w-5 text-gray-600" />
    }
  }

  const getTypeBadge = (type: string) => {
    const colors = {
      PDF: "bg-red-100 text-red-800",
      Video: "bg-blue-100 text-blue-800",
      Audio: "bg-green-100 text-green-800",
      Image: "bg-purple-100 text-purple-800",
    }
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Digital Library</h1>
          <p className="text-gray-600 mt-1">Access course materials, textbooks, and educational resources</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700">
          <BookOpen className="h-4 w-4 mr-2" />
          Request Resource
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Resources</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,847</div>
            <p className="text-xs text-muted-foreground">+127 this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Downloads</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15,432</div>
            <p className="text-xs text-muted-foreground">+892 this week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New This Week</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">Across all subjects</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.6</div>
            <p className="text-xs text-muted-foreground">Based on user reviews</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="browse" className="space-y-6">
        <TabsList>
          <TabsTrigger value="browse">Browse Resources</TabsTrigger>
          <TabsTrigger value="favorites">My Favorites</TabsTrigger>
          <TabsTrigger value="recent">Recently Accessed</TabsTrigger>
        </TabsList>

        <TabsContent value="browse">
          <Card>
            <CardHeader>
              <CardTitle>Resource Library</CardTitle>
              <CardDescription>Search and filter educational materials</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search resources..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="audio">Audio</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterSubject} onValueChange={setFilterSubject}>
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <SelectValue placeholder="Subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    <SelectItem value="Mathematics">Mathematics</SelectItem>
                    <SelectItem value="English">English</SelectItem>
                    <SelectItem value="Biology">Biology</SelectItem>
                    <SelectItem value="History">History</SelectItem>
                    <SelectItem value="Chemistry">Chemistry</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Resource Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredResources.map((resource) => (
                  <Card key={resource.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        <div className="flex-shrink-0">
                          <div className="w-16 h-20 bg-gray-100 rounded flex items-center justify-center">
                            {getTypeIcon(resource.type)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-sm truncate">{resource.title}</h3>
                            <Badge className={`text-xs ${getTypeBadge(resource.type)}`}>{resource.type}</Badge>
                          </div>
                          <p className="text-xs text-gray-600 mb-2">{resource.author}</p>
                          <p className="text-xs text-gray-500 mb-3 line-clamp-2">{resource.description}</p>

                          <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                            <span>{resource.size}</span>
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span>{resource.rating}</span>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="flex-1 bg-transparent">
                              <Eye className="h-3 w-3 mr-1" />
                              Preview
                            </Button>
                            <Button size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                              <Download className="h-3 w-3 mr-1" />
                              Download
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="favorites">
          <Card>
            <CardHeader>
              <CardTitle>My Favorites</CardTitle>
              <CardDescription>Resources you've bookmarked for quick access</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No favorites yet</h3>
                <p className="text-gray-600">Start adding resources to your favorites to see them here.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle>Recently Accessed</CardTitle>
              <CardDescription>Resources you've viewed or downloaded recently</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {resources.slice(0, 3).map((resource) => (
                  <div key={resource.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="flex-shrink-0">{getTypeIcon(resource.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{resource.title}</div>
                      <div className="text-xs text-gray-600">
                        {resource.author} • {resource.subject}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />2 hours ago
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
