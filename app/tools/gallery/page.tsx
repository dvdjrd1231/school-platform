"use client"
import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Upload, Eye, Download, Heart } from "lucide-react"

const galleryItems = [
  {
    id: 1,
    title: "Science Lab Experiment",
    type: "Photo",
    uploadedBy: "Alice Johnson",
    date: "2024-01-20",
    likes: 12,
    category: "Science",
    thumbnail: "/science-lab-experiment.png",
  },
  {
    id: 2,
    title: "Art Class Painting",
    type: "Photo",
    uploadedBy: "Bob Smith",
    date: "2024-01-19",
    likes: 8,
    category: "Art",
    thumbnail: "/student-art-painting.png",
  },
  {
    id: 3,
    title: "Math Problem Solving",
    type: "Video",
    uploadedBy: "Carol Davis",
    date: "2024-01-18",
    likes: 15,
    category: "Math",
    thumbnail: "/math-problem-solving-video.png",
  },
  {
    id: 4,
    title: "History Presentation",
    type: "Document",
    uploadedBy: "David Wilson",
    date: "2024-01-17",
    likes: 6,
    category: "History",
    thumbnail: "/history-presentation-slides.png",
  },
]

export default function ClassMediaGalleryPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")

  const categories = ["All", "Science", "Art", "Math", "History", "English"]

  const filteredItems = galleryItems.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Class Media Gallery</h1>
            <p className="text-gray-600 mt-2">Shared media and resources from the class</p>
          </div>
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Upload className="h-4 w-4 mr-2" />
            Upload Media
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search media..."
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

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative">
                <img src={item.thumbnail || "/placeholder.svg"} alt={item.title} className="w-full h-48 object-cover" />
                <div className="absolute top-2 right-2">
                  <Badge variant="secondary">{item.type}</Badge>
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                  <span>By {item.uploadedBy}</span>
                  <span>{item.date}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{item.category}</Badge>
                    <div className="flex items-center space-x-1">
                      <Heart className="h-4 w-4 text-red-500" />
                      <span className="text-sm">{item.likes}</span>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
