import Link from "next/link"
import { FileQuestion, Home } from "lucide-react"

import { Button } from "@/components/ui/button"

/**
 * Shown for an address that doesn't exist — including a link to something that
 * has since been deleted, which is otherwise an unexplained blank page.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <FileQuestion className="h-7 w-7 text-muted-foreground" />
        </div>

        <h1 className="mb-2 text-2xl font-bold">We can&apos;t find that page</h1>
        <p className="mb-6 text-muted-foreground">
          It may have been removed, or the link may be out of date.
        </p>

        <Button asChild>
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            Go home
          </Link>
        </Button>
      </div>
    </div>
  )
}
