"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Bell, Clock, User, ExternalLink } from "lucide-react"
import { getUpdates } from "@/lib/database"
import { useRouter } from "next/navigation"

export default function UpdatesPage() {
  const [updates, setUpdates] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => {
    setUpdates(getUpdates())
  }, [])

  const handleUpdateClick = (update: any) => {
    if (update.link) {
      router.push(update.link)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-emerald-600">Updates</h1>
        <p className="text-muted-foreground">Stay informed with the latest course and platform updates</p>
      </div>

      <div className="space-y-4">
        {updates.map((update) => (
          <Card
            key={update.id}
            className={`cursor-pointer hover:shadow-lg transition-shadow ${!update.read ? "border-emerald-200 bg-emerald-50" : ""}`}
            onClick={() => handleUpdateClick(update)}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className={`h-5 w-5 ${!update.read ? "text-emerald-600" : "text-muted-foreground"}`} />
                  <div>
                    <CardTitle className="text-lg">{update.title}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>{update.author}</span>
                      <Clock className="h-4 w-4 ml-2" />
                      <span>{update.date}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!update.read && <Badge variant="default">New</Badge>}
                  <Badge variant="outline">{update.category}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{update.description}</p>

              {update.link && (
                <Button variant="outline" size="sm" onClick={() => handleUpdateClick(update)}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
