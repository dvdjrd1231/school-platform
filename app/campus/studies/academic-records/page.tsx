import { FileText, Download, Send, Clock, CheckCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function AcademicRecordsPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Academic Records and Requests</h1>
        <p className="text-gray-600">Access your records and submit official requests</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Academic Records */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-emerald-600" />
                <span>My Academic Records</span>
              </CardTitle>
              <CardDescription>Download and view your official documents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Official Transcript</h4>
                    <p className="text-sm text-gray-600">Complete academic history</p>
                  </div>
                  <Button size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Degree Audit</h4>
                    <p className="text-sm text-gray-600">Progress toward graduation</p>
                  </div>
                  <Button size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Enrollment Verification</h4>
                    <p className="text-sm text-gray-600">Current enrollment status</p>
                  </div>
                  <Button size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Grade Reports</h4>
                    <p className="text-sm text-gray-600">Semester grade summaries</p>
                  </div>
                  <Button size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Request Status */}
          <Card>
            <CardHeader>
              <CardTitle>Request Status</CardTitle>
              <CardDescription>Track your submitted requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <h4 className="font-medium text-green-800">Transcript Request</h4>
                      <p className="text-sm text-green-600">Sent to University of California</p>
                    </div>
                  </div>
                  <Badge variant="secondary">Completed</Badge>
                </div>

                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <div>
                      <h4 className="font-medium text-blue-800">Enrollment Verification</h4>
                      <p className="text-sm text-blue-600">For scholarship application</p>
                    </div>
                  </div>
                  <Badge variant="outline">Processing</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* New Request Form */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Send className="h-5 w-5 text-emerald-600" />
                <span>Submit New Request</span>
              </CardTitle>
              <CardDescription>Request official documents or records</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div>
                  <Label htmlFor="request-type">Request Type</Label>
                  <select
                    id="request-type"
                    className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">Select request type</option>
                    <option value="transcript">Official Transcript</option>
                    <option value="enrollment">Enrollment Verification</option>
                    <option value="degree">Degree Verification</option>
                    <option value="grades">Grade Report</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="recipient">Recipient/Institution</Label>
                  <Input id="recipient" placeholder="Where should this be sent?" className="mt-1" />
                </div>

                <div>
                  <Label htmlFor="address">Mailing Address</Label>
                  <Textarea id="address" placeholder="Complete mailing address" className="mt-1" rows={3} />
                </div>

                <div>
                  <Label htmlFor="purpose">Purpose of Request</Label>
                  <Input id="purpose" placeholder="e.g., Graduate school application" className="mt-1" />
                </div>

                <div>
                  <Label htmlFor="rush">Rush Processing</Label>
                  <div className="mt-1 flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="rush"
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <label htmlFor="rush" className="text-sm text-gray-600">
                      Rush processing (+$25 fee)
                    </label>
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any special instructions or requirements"
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <Button type="submit" className="w-full">
                  <Send className="h-4 w-4 mr-2" />
                  Submit Request
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
