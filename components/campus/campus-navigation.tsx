import Link from "next/link"
import { ChevronDown } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

export { CampusNavigation }
export default CampusNavigation

function CampusNavigation() {
  return (
    <nav className="fixed top-16 left-0 right-0 z-40 bg-emerald-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12">
          <div className="flex items-center space-x-8">
            {/* My Studies Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-white hover:bg-emerald-700 flex items-center space-x-1">
                  <span>My Studies</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/classrooms">Classrooms</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/campus/studies/degree-plan">Degree Plan</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/campus/studies/seminar-schedule">Seminar Schedule</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/campus/studies/grade-reports">Grade Reports</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/campus/studies/skills-report">Skills Report</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/campus/studies/academic-records">Academic Records and Requests</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Resources Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-white hover:bg-emerald-700 flex items-center space-x-1">
                  <span>Resources</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/campus/resources/success-center">Success Center</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/campus/resources/advising-support">Advising Support</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/campus/resources/program-resources">Program Resources</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/campus/resources/student-assistant">Student Assistant Program</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/campus/resources/student-store">Student Store and Discounts</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Community Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-white hover:bg-emerald-700 flex items-center space-x-1">
                  <span>Community</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/campus/community/student-life">Office of Student Life</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/campus/community/alumni">Alumni Engagement</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/campus/community/rights-responsibilities">Students Rights and Responsibilities</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* My Account Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-white hover:bg-emerald-700 flex items-center space-x-1">
                  <span>My Account</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/campus/account/documents">Documents</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/campus/account/finances">Finances</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/campus/account/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/campus/account/contact">Contact Information</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/campus/account/preferences">Preferences</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/campus/account/notifications">Notifications Settings</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Help Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-white hover:bg-emerald-700 flex items-center space-x-1">
                  <span>Help</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/campus/help/support">Support</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/campus/help/contact">Contact Us</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  )
}
