"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useRole } from "@/components/context/role-context"
import {
  BookOpen,
  MessageSquare,
  FileText,
  ClipboardCheck,
  BarChart3,
  Settings,
  HelpCircle,
  ChevronDown,
  Users,
  Library,
  UserCheck,
  Calendar,
  Megaphone,
  Home,
  GraduationCap,
  TrendingUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const navigationItems = [
  {
    title: "Classrooms",
    href: "/classrooms",
    icon: Home,
  },
  {
    title: "Content",
    href: "/content",
    icon: BookOpen,
  },
  {
    title: "Discussions",
    href: "/discussions",
    icon: MessageSquare,
  },
  {
    title: "Assignments",
    href: "/assignments",
    icon: FileText,
  },
  {
    title: "Quizzes",
    href: "/quizzes",
    icon: ClipboardCheck,
  },
  {
    title: "Grades",
    href: "/grades",
    icon: BarChart3,
  },
  {
    title: "Performance",
    href: "/performance",
    icon: TrendingUp,
  },
]

const moreToolsItems = [
  { title: "Class Progress", href: "/tools/progress", icon: BarChart3 },
  { title: "Class List", href: "/tools/class-list", icon: Users },
  { title: "Library", href: "/tools/library", icon: Library },
  { title: "Groups", href: "/tools/groups", icon: Users },
  { title: "Surveys", href: "/tools/surveys", icon: ClipboardCheck },
  { title: "E Portfolio", href: "/tools/portfolio", icon: FileText },
  { title: "My Media", href: "/tools/media", icon: FileText },
  { title: "Class Media Gallery", href: "/tools/gallery", icon: FileText },
  { title: "Seminar", href: "/tools/seminar", icon: GraduationCap },
]

const helpItems = [
  { title: "Tutor", href: "/help/tutor", icon: UserCheck },
  { title: "School Campus", href: "/", icon: GraduationCap },
]

const adminItems = [
  { title: "Admin Dashboard", href: "/admin", icon: Settings },
  { title: "User Management", href: "/admin/users", icon: Users },
  { title: "Class Management", href: "/admin/classes", icon: GraduationCap },
  { title: "Lesson Management", href: "/admin/lessons", icon: BookOpen },
  { title: "Grade Management", href: "/admin/grades", icon: BarChart3 },
]

export function Navigation() {
  const pathname = usePathname()
  const { isAdmin, isTeacher, currentRole } = useRole()

  return (
    <nav className="border-b bg-card">
      <div className="container px-4">
        <div className="flex items-center justify-between h-12">
          <div className="flex items-center space-x-1">
            {navigationItems.map((item) => {
              const Icon = item.icon
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={pathname === item.href ? "default" : "ghost"}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {item.title}
                  </Button>
                </Link>
              )
            })}

            {isAdmin && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2 text-emerald-600">
                    <Settings className="h-4 w-4" />
                    Admin
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  {adminItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <DropdownMenuItem key={item.href} asChild>
                        <Link href={item.href} className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {item.title}
                        </Link>
                      </DropdownMenuItem>
                    )
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* More Tools Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  More Tools
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                {moreToolsItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link href={item.href} className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {item.title}
                      </Link>
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Help Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" />
                  Help
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                {helpItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link href={item.href} className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {item.title}
                      </Link>
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Quick Access Items */}
          <div className="flex items-center space-x-2">
            <Link href="/announcements">
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <Megaphone className="h-4 w-4" />
                Announcements
              </Button>
            </Link>
            <Link href="/calendar">
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Calendar
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
