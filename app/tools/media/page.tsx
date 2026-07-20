"use client"
import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Upload, Search, Download, Trash2, Eye, FileText, ImageIcon, Video, Music } from "lucide-react"

const mediaFiles = [
  {
    id: 1,
    name: "Math Assignment Template.pdf",
    type: "pdf",
    size: "2.4 MB",
    uploadDate: "2024-01-15",
    category: "Documents",
    usedIn: ["Assignment 1", "Quiz 3"],
  },
  {
    id: 2,
    name: "Science Experiment Video.mp4",
    type: "video",
    size: "45.2 MB",
    uploadDate: "2024-01-14",
    category: "Videos",
    usedIn: ["Content Module 2"],
  },
  {
    id: 3,
    name: "History Timeline.png",
    type: "image",
    size: "1.8 MB",
    uploadDate: "2024-01-13",
    category: "Images",
    usedIn: ["Discussion Post"],
  },
  {
    id: 4,
    name: "Audio Lesson Recording.mp3",
    type: "audio",
    size: "12.5 MB",
    uploadDate: "2024-01-12",
    category: "Audio",
    usedIn: [],
  },
]

const getFileIcon = (type: string) => {
  switch (type) {
    case "pdf":
    case "doc":
      return <FileText className="h-8 w-8 text-red-500" />
    case "image":
    case "png":
    case "jpg":
      return <ImageIcon className="h-8 w-8 text-blue-500" />
    case "video":
    case "mp4":
      return <Video className="h-8 w-8 text-purple-500" />
    case "audio":
    case "mp3":
      return <Music className="h-8 w-8 text-green-500" />
    default:
      return <FileText className="h-8 w-8 text-gray-500" />
  }
}

export default function MyMediaPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")

  const categories = ["All", "Documents", "Images", "Videos", "Audio"]

  const filteredFiles = mediaFiles.filter((file) => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "All" || file.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Media</h1>
            <p className="text-gray-600 mt-2">Manage your uploaded files and media resources</p>
          </div>
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Upload className="h-4 w-4 mr-2" />
            Upload Files
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Files</p>
                  <p className="text-2xl font-bold text-gray-900">24</p>
                </div>
                <FileText className="h-8 w-8 text-emerald-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Storage Used</p>
                  <p className="text-2xl font-bold text-gray-900">156 MB</p>
                </div>
                <Upload className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Used in Assignments</p>
                  <p className="text-2xl font-bold text-gray-900">8</p>
                </div>
                <Eye className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Recent Uploads</p>
                  <p className="text-2xl font-bold text-gray-900">3</p>
                </div>
                <Upload className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
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

        {/* Files Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFiles.map((file) => (
            <Card key={file.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  {getFileIcon(file.type)}
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <h3 className="font-semibold text-gray-900 mb-2 truncate">{file.name}</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Size:</span>
                    <span>{file.size}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Uploaded:</span>
                    <span>{file.uploadDate}</span>
                  </div>
                </div>

                <div className="mt-4">
                  <Badge variant="secondary" className="mb-2">
                    {file.category}
                  </Badge>
                  {file.usedIn.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Used in:</p>
                      <div className="flex flex-wrap gap-1">
                        {file.usedIn.map((usage, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {usage}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
