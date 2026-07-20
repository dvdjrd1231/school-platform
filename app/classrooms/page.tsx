import { Sidebar } from "@/components/layout/sidebar"
import { DashboardContent } from "@/components/dashboard/dashboard-content"

export default function HomePage() {
  return (
    <div className="flex w-full">
      <Sidebar />
      <div className="flex-1">
        <DashboardContent />
      </div>
    </div>
  )
}
