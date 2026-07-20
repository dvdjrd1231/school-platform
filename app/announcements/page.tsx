"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Megaphone, Clock, User, Pin, MessageSquare } from "lucide-react"
import { getAnnouncements } from "@/lib/database"

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([])

  useEffect(() => {
    setAnnouncements(getAnnouncements())
  }, [])

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-emerald-600">Announcements</h1>
        <p className="text-muted-foreground">Important updates and notifications from your instructors</p>
      </div>

      <div className="space-y-4">
        {announcements.map((announcement) => (
          <Card key={announcement.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {announcement.pinned && <Pin className="h-5 w-5 text-emerald-600" />}
                  <Megaphone className="h-5 w-5 text-emerald-600" />
                  <div>
                    <CardTitle className="text-lg">{announcement.title}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>{announcement.author}</span>
                      <Clock className="h-4 w-4 ml-2" />
                      <span>{announcement.date}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {announcement.pinned && <Badge variant="default">Pinned</Badge>}
                  <Badge variant="outline">{announcement.priority}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{announcement.content}</p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Course: {announcement.course}</span>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    <span>{announcement.replies} replies</span>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Reply
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
