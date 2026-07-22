import { Sidebar } from "@/components/layout/sidebar"
import { ModuleContent } from "@/components/content/module-content"

interface ModulePageProps {
  params: Promise<{ moduleId: string }>
}

export default async function ModulePage({ params }: ModulePageProps) {
  const { moduleId } = await params

  return (
    <div className="flex w-full">
      <Sidebar />
      <div className="flex-1">
        <ModuleContent moduleId={moduleId} />
      </div>
    </div>
  )
}
