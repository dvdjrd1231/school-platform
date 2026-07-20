import { DollarSign, CreditCard, Receipt, TrendingDown } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function FinancesPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Financial Information</h1>
        <p className="text-gray-600">Manage your tuition, fees, and financial aid</p>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-emerald-600" />
              <span>Account Balance</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">$0.00</div>
            <p className="text-sm text-gray-600">Current balance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center space-x-2">
              <Receipt className="h-5 w-5 text-blue-600" />
              <span>This Semester</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">$12,450</div>
            <p className="text-sm text-gray-600">Total charges</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center space-x-2">
              <TrendingDown className="h-5 w-5 text-purple-600" />
              <span>Financial Aid</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">$8,500</div>
            <p className="text-sm text-gray-600">Aid received</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center space-x-2">
              <CreditCard className="h-5 w-5 text-orange-600" />
              <span>Payments Made</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">$3,950</div>
            <p className="text-sm text-gray-600">Total paid</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Current Charges */}
        <Card>
          <CardHeader>
            <CardTitle>Current Semester Charges</CardTitle>
            <CardDescription>Fall 2024 billing details</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Tuition</TableCell>
                  <TableCell className="text-right">$10,500</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Student Fees</TableCell>
                  <TableCell className="text-right">$850</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Technology Fee</TableCell>
                  <TableCell className="text-right">$300</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Health Services</TableCell>
                  <TableCell className="text-right">$200</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Parking Permit</TableCell>
                  <TableCell className="text-right">$150</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Library Fee</TableCell>
                  <TableCell className="text-right">$50</TableCell>
                </TableRow>
                <TableRow className="border-t-2">
                  <TableCell className="font-semibold">Total Charges</TableCell>
                  <TableCell className="text-right font-semibold">$12,050</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Payment History & Financial Aid */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Financial Aid Summary</CardTitle>
              <CardDescription>Aid for Fall 2024</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <h5 className="font-medium text-green-800">Merit Scholarship</h5>
                    <p className="text-sm text-green-600">Academic Excellence Award</p>
                  </div>
                  <span className="font-semibold text-green-800">$5,000</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <h5 className="font-medium text-blue-800">Federal Pell Grant</h5>
                    <p className="text-sm text-blue-600">Need-based aid</p>
                  </div>
                  <span className="font-semibold text-blue-800">$2,500</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div>
                    <h5 className="font-medium text-purple-800">Work Study</h5>
                    <p className="text-sm text-purple-600">Campus employment</p>
                  </div>
                  <span className="font-semibold text-purple-800">$1,000</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Payments</CardTitle>
              <CardDescription>Payment history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h5 className="font-medium">Online Payment</h5>
                    <p className="text-sm text-gray-600">Dec 1, 2024</p>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold">$2,000</span>
                    <Badge variant="secondary" className="ml-2">
                      Processed
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h5 className="font-medium">Financial Aid Disbursement</h5>
                    <p className="text-sm text-gray-600">Aug 15, 2024</p>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold">$8,500</span>
                    <Badge variant="secondary" className="ml-2">
                      Applied
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h5 className="font-medium">Payment Plan</h5>
                    <p className="text-sm text-gray-600">Aug 1, 2024</p>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold">$1,950</span>
                    <Badge variant="secondary" className="ml-2">
                      Completed
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t">
                <Button className="w-full">Make a Payment</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
