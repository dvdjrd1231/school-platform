import { Sidebar } from "@/components/layout/sidebar"
import { ModuleContent } from "@/components/content/module-content"

interface ModulePageProps {
  params: {
    moduleId: string
  }
}

export default function ModulePage({ params }: ModulePageProps) {
  return (
    <div className="flex w-full">
      <Sidebar />
      <div className="flex-1">
        <ModuleContent moduleId={params.moduleId} />
      </div>
    </div>
  )
}
