import type { ReactNode } from "react"

/**
 * Centers and constrains every admin page.
 *
 * The shared <main> in ConditionalLayout is `display:flex`, so a page whose
 * root has no width collapses to its content and hugs the left edge (the empty
 * right-hand gap the admin screens showed). `flex-1` makes this fill the flex
 * row; the inner wrapper centers the content and gives it consistent padding.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex-1 w-full min-h-[calc(100vh-7rem)] bg-muted/30">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</div>
    </div>
  )
}
