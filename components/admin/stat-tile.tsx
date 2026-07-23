import type { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export interface StatTileProps {
  label: string
  value: number | string | null | undefined
  icon: LucideIcon
  /** Tailwind text color class for the icon, e.g. "text-blue-600". */
  color: string
  /** Tailwind background class for the icon badge, e.g. "bg-blue-50". */
  bg: string
}

/**
 * The shared admin stat tile: a tinted icon badge above a large value and a
 * muted label. Used across every admin page so the dashboards read as one set.
 */
export function StatTile({ label, value, icon: Icon, color, bg }: StatTileProps) {
  return (
    <Card className="border-none shadow-sm transition-shadow hover:shadow-md">
      <CardContent className="flex flex-col gap-3 p-5">
        <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </span>
        <div>
          <p className="text-3xl font-bold tracking-tight">{value ?? "—"}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}
