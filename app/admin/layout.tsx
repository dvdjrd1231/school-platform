import type { ReactNode } from "react"

/**
 * Padding for admin pages. Horizontal centering and max width now come from the
 * shared <main> in ConditionalLayout, so this only owns the inner spacing.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return <div className="px-4 py-6 sm:px-6 lg:px-8">{children}</div>
}
