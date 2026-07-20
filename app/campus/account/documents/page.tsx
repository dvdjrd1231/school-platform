import { FileText, Download, Upload, Eye, Trash2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function DocumentsPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Documents</h1>
        <p className="text-gray-600">Manage your personal and academic documents</p>
      </div>

      {/* Upload Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5 text-emerald-600" />
            <span>Upload Documents</span>
          </CardTitle>
          <CardDescription>Add new documents to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">Drop files here or click to upload</p>
            <p className="text-sm text-gray-600 mb-4">Supported formats: PDF, DOC, DOCX, JPG, PNG (Max 10MB)</p>
            <Button>Choose Files</Button>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-emerald-600" />
            <span>My Documents</span>
          </CardTitle>
          <CardDescription>All your uploaded and generated documents</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Upload Date</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-red-500" />
                    <span>Official_Transcript_2024.pdf</span>
                  </div>
                </TableCell>
                <TableCell>Academic Record</TableCell>
                <TableCell>Dec 1, 2024</TableCell>
                <TableCell>2.3 MB</TableCell>
                <TableCell>
                  <Badge variant="secondary">Verified</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <span>Enrollment_Verification.pdf</span>
                  </div>
                </TableCell>
                <TableCell>Verification</TableCell>
                <TableCell>Nov 28, 2024</TableCell>
                <TableCell>1.1 MB</TableCell>
                <TableCell>
                  <Badge variant="secondary">Active</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-green-500" />
                    <span>ID_Card_Photo.jpg</span>
                  </div>
                </TableCell>
                <TableCell>Personal</TableCell>
                <TableCell>Nov 15, 2024</TableCell>
                <TableCell>856 KB</TableCell>
                <TableCell>
                  <Badge variant="secondary">Approved</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-purple-500" />
                    <span>Financial_Aid_Form.pdf</span>
                  </div>
                </TableCell>
                <TableCell>Financial</TableCell>
                <TableCell>Oct 30, 2024</TableCell>
                <TableCell>1.8 MB</TableCell>
                <TableCell>
                  <Badge variant="outline">Pending Review</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
