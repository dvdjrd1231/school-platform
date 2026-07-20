"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Eye, Edit, Share, FileText } from "lucide-react"

const portfolioItems = [
  {
    id: 1,
    title: "Science Fair Project",
    type: "Project",
    description: "Solar energy efficiency research and presentation",
    date: "2024-01-20",
    status: "Published",
    attachments: 3,
    views: 24,
  },
  {
    id: 2,
    title: "Creative Writing Portfolio",
    type: "Writing",
    description: "Collection of short stories and poems",
    date: "2024-01-18",
    status: "Draft",
    attachments: 5,
    views: 0,
  },
  {
    id: 3,
    title: "Math Problem Solving",
    type: "Assignment",
    description: "Advanced calculus problem solutions",
    date: "2024-01-15",
    status: "Published",
    attachments: 2,
    views: 12,
  },
]

export default function EPortfolioPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">E-Portfolio</h1>
            <p className="text-gray-600 mt-2">Showcase your academic work and achievements</p>
          </div>
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Items</p>
                  <p className="text-2xl font-bold text-gray-900">12</p>
                </div>
                <FileText className="h-8 w-8 text-emerald-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Published</p>
                  <p className="text-2xl font-bold text-gray-900">8</p>
                </div>
                <Eye className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Views</p>
                  <p className="text-2xl font-bold text-gray-900">156</p>
                </div>
                <Share className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Drafts</p>
                  <p className="text-2xl font-bold text-gray-900">4</p>
                </div>
                <Edit className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Portfolio Items */}
        <div className="space-y-6">
          {portfolioItems.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">{item.title}</CardTitle>
                    <p className="text-gray-600 mt-1">{item.description}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={item.status === "Published" ? "default" : "secondary"}>{item.status}</Badge>
                    <Badge variant="outline">{item.type}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>Created: {item.date}</span>
                    <span>Attachments: {item.attachments}</span>
                    <span>Views: {item.views}</span>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm">
                      <Share className="h-4 w-4 mr-1" />
                      Share
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
