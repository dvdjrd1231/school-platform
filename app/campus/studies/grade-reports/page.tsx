import { TrendingUp, Download, Eye, Calendar } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function GradeReportsPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Grade Reports</h1>
        <p className="text-gray-600">View and download your academic transcripts</p>
      </div>

      {/* Current Semester */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
            <span>Fall 2024 - Current Semester</span>
          </CardTitle>
          <CardDescription>Current semester grades and progress</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course</TableHead>
                <TableHead>Credits</TableHead>
                <TableHead>Current Grade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>
                  <div>
                    <div className="font-medium">Advanced Mathematics</div>
                    <div className="text-sm text-gray-500">MATH 301</div>
                  </div>
                </TableCell>
                <TableCell>3</TableCell>
                <TableCell>
                  <Badge variant="secondary">A-</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">In Progress</Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <div>
                    <div className="font-medium">English Literature</div>
                    <div className="text-sm text-gray-500">ENG 201</div>
                  </div>
                </TableCell>
                <TableCell>3</TableCell>
                <TableCell>
                  <Badge variant="secondary">B+</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">In Progress</Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Historical Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-emerald-600" />
            <span>Historical Grade Reports</span>
          </CardTitle>
          <CardDescription>Download official transcripts and grade reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Official Transcript</h4>
                <p className="text-sm text-gray-600">Complete academic record through Fall 2024</p>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Button>
                <Button size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Spring 2024 Grade Report</h4>
                <p className="text-sm text-gray-600">Semester GPA: 3.8</p>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Button>
                <Button size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Fall 2023 Grade Report</h4>
                <p className="text-sm text-gray-600">Semester GPA: 3.6</p>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Button>
                <Button size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
