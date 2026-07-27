import { Info, Mail } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

/**
 * Fees and payments.
 *
 * The template shipped this page with an invented balance, invented transactions
 * and a "Make a payment" button wired to nothing. Fabricated financial figures
 * are worse than an empty screen — someone would believe them — and the platform
 * has no billing subsystem to replace them with. So this states plainly that
 * fees are handled by the school office and points people there.
 *
 * If billing should live in the platform, it's a genuine new subsystem: invoices,
 * a payment provider, refunds, receipts and an audit trail. It was never part of
 * this build.
 */
export default function FinancesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">Fees and payments</h1>
        <p className="text-gray-600">How to deal with anything to do with fees</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="h-5 w-5" />
            Fees are handled by the school office
          </CardTitle>
          <CardDescription>
            This platform doesn&apos;t hold billing information, so nothing about your account
            balance is shown here.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p className="text-muted-foreground">
            For invoices, payment plans, receipts or anything else about fees, contact the school
            office directly. They can also confirm what&apos;s outstanding on your account.
          </p>

          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/campus/resources/advising-support">
                <Mail className="mr-2 h-4 w-4" />
                Contact the office
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/messages">Open messages</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
