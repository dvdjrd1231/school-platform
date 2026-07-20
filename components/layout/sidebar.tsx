"use client"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { BookOpen, ChevronRight, FileText, Calendar, Megaphone, User, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const sidebarItems = [
  {
    title: "My Courses",
    href: "/courses",
    icon: BookOpen,
    badge: "3",
  },
  {
    title: "My Surveys",
    href: "/surveys",
    icon: FileText,
  },
  {
    title: "Updates",
    href: "/updates",
    icon: BarChart3,
    badge: "2",
  },
  {
    title: "Announcements",
    href: "/announcements",
    icon: Megaphone,
    badge: "5",
  },
  {
    title: "Calendar",
    href: "/calendar",
    icon: Calendar,
  },
  {
    title: "Instructor Profile",
    href: "/instructor",
    icon: User,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleChapterClick = (chapterNumber: number) => {
    router.push(`/content/chapter-${chapterNumber}`)
  }

  return (
    <aside className="w-64 border-r bg-sidebar min-h-screen">
      <div className="p-4 space-y-4">
        {/* Course Selection Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Select a Course</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <select className="w-full p-2 text-sm border rounded-md bg-background">
              <option>Mathematics - Grade 10</option>
              <option>English Literature - Grade 10</option>
              <option>Science - Grade 10</option>
            </select>
          </CardContent>
        </Card>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn("w-full justify-between text-left", isActive && "bg-sidebar-accent")}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    <span className="text-sm">{item.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {item.badge}
                      </Badge>
                    )}
                    <ChevronRight className="h-3 w-3" />
                  </div>
                </Button>
              </Link>
            )
          })}
        </nav>

        {/* Table of Contents */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Table of Contents
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            <div className="text-xs text-muted-foreground space-y-1">
              <div
                className="flex items-center justify-between cursor-pointer hover:bg-accent rounded p-1 transition-colors"
                onClick={() => handleChapterClick(1)}
              >
                <span>Chapter 1: Introduction</span>
                <Badge variant="outline" className="text-xs">
                  Done
                </Badge>
              </div>
              <div
                className="flex items-center justify-between cursor-pointer hover:bg-accent rounded p-1 transition-colors"
                onClick={() => handleChapterClick(2)}
              >
                <span>Chapter 2: Fundamentals</span>
                <Badge variant="secondary" className="text-xs">
                  Current
                </Badge>
              </div>
              <div
                className="text-muted-foreground/60 cursor-pointer hover:bg-accent rounded p-1 transition-colors"
                onClick={() => handleChapterClick(3)}
              >
                Chapter 3: Advanced Topics
              </div>
              <div
                className="text-muted-foreground/60 cursor-pointer hover:bg-accent rounded p-1 transition-colors"
                onClick={() => handleChapterClick(4)}
              >
                Chapter 4: Applications
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </aside>
  )
}
