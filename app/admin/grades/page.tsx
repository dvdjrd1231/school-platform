"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  Plus,
  TrendingUp,
  TrendingDown,
  Award,
  FileText,
  MoreHorizontal,
  Edit,
  Download,
  Eye,
  Calculator,
  BarChart3,
  Users,
  BookOpen,
} from "lucide-react"

export default function GradeManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterClass, setFilterClass] = useState("all")
  const [filterGradeRange, setFilterGradeRange] = useState("all")
  const [isGradeDialogOpen, setIsGradeDialogOpen] = useState(false)

  // Mock data for student grades
  const studentGrades = [
    {
      id: 1,
      studentName: "Emma Johnson",
      studentId: "STU001",
      class: "Mathematics 101",
      assignments: 92,
      quizzes: 88,
      midterm: 85,
      final: 90,
      participation: 95,
      overall: 90,
      letterGrade: "A-",
      gpa: 3.7,
      trend: "up",
    },
    {
      id: 2,
      studentName: "Michael Chen",
      studentId: "STU002",
      class: "Mathematics 101",
      assignments: 78,
      quizzes: 82,
      midterm: 75,
      final: 80,
      participation: 88,
      overall: 81,
      letterGrade: "B-",
      gpa: 2.7,
      trend: "up",
    },
    {
      id: 3,
      studentName: "Sarah Williams",
      studentId: "STU003",
      class: "English Literature",
      assignments: 95,
      quizzes: 92,
      midterm: 88,
      final: 94,
      participation: 90,
      overall: 92,
      letterGrade: "A-",
      gpa: 3.7,
      trend: "stable",
    },
    {
      id: 4,
      studentName: "David Rodriguez",
      studentId: "STU004",
      class: "Biology Fundamentals",
      assignments: 85,
      quizzes: 79,
      midterm: 82,
      final: 78,
      participation: 92,
      overall: 83,
      letterGrade: "B",
      gpa: 3.0,
      trend: "down",
    },
    {
      id: 5,
      studentName: "Lisa Thompson",
      studentId: "STU005",
      class: "World History",
      assignments: 88,
      quizzes: 91,
      midterm: 86,
      final: 89,
      participation: 94,
      overall: 90,
      letterGrade: "A-",
      gpa: 3.7,
      trend: "up",
    },
  ]

  const filteredGrades = studentGrades.filter((grade) => {
    const matchesSearch =
      grade.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grade.studentId.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesClass = filterClass === "all" || grade.class === filterClass
    const matchesGradeRange =
      filterGradeRange === "all" ||
      (filterGradeRange === "A" && grade.overall >= 90) ||
      (filterGradeRange === "B" && grade.overall >= 80 && grade.overall < 90) ||
      (filterGradeRange === "C" && grade.overall >= 70 && grade.overall < 80) ||
      (filterGradeRange === "D" && grade.overall >= 60 && grade.overall < 70) ||
      (filterGradeRange === "F" && grade.overall < 60)
    return matchesSearch && matchesClass && matchesGradeRange
  })

  const getGradeBadge = (letterGrade: string, overall: number) => {
    if (overall >= 90) return <Badge className="bg-emerald-100 text-emerald-800">{letterGrade}</Badge>
    if (overall >= 80) return <Badge className="bg-blue-100 text-blue-800">{letterGrade}</Badge>
    if (overall >= 70) return <Badge className="bg-yellow-100 text-yellow-800">{letterGrade}</Badge>
    if (overall >= 60) return <Badge className="bg-orange-100 text-orange-800">{letterGrade}</Badge>
    return <Badge variant="destructive">{letterGrade}</Badge>
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-emerald-600" />
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <div className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Grade Management</h1>
          <p className="text-gray-600 mt-1">Manage student grades and academic performance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Grades
          </Button>
          <Dialog open={isGradeDialogOpen} onOpenChange={setIsGradeDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Grade
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Grade</DialogTitle>
                <DialogDescription>Enter grade information for a student assessment.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="student">Student</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select student" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="emma">Emma Johnson</SelectItem>
                        <SelectItem value="michael">Michael Chen</SelectItem>
                        <SelectItem value="sarah">Sarah Williams</SelectItem>
                        <SelectItem value="david">David Rodriguez</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="class">Class</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="math">Mathematics 101</SelectItem>
                        <SelectItem value="english">English Literature</SelectItem>
                        <SelectItem value="biology">Biology Fundamentals</SelectItem>
                        <SelectItem value="history">World History</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="assessment">Assessment Type</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="assignment">Assignment</SelectItem>
                        <SelectItem value="quiz">Quiz</SelectItem>
                        <SelectItem value="midterm">Midterm Exam</SelectItem>
                        <SelectItem value="final">Final Exam</SelectItem>
                        <SelectItem value="participation">Participation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="grade">Grade (%)</Label>
                    <Input id="grade" type="number" min="0" max="100" placeholder="85" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="comments">Comments (Optional)</Label>
                  <Textarea id="comments" placeholder="Additional feedback or notes..." />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsGradeDialogOpen(false)}>
                  Cancel
                </Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setIsGradeDialogOpen(false)}>
                  Add Grade
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Class Average</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87.2%</div>
            <p className="text-xs text-muted-foreground">+2.1% from last term</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Honor Roll</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42</div>
            <p className="text-xs text-muted-foreground">28% of students</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At Risk</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">5% of students</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg GPA</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3.2</div>
            <p className="text-xs text-muted-foreground">+0.1 from last term</p>
          </CardContent>
        </Card>
      </div>

      {/* Grade Management Tabs */}
      <Tabs defaultValue="gradebook" className="space-y-4">
        <TabsList>
          <TabsTrigger value="gradebook">Grade Book</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="gradebook">
          <Card>
            <CardHeader>
              <CardTitle>Student Grade Book</CardTitle>
              <CardDescription>View and manage individual student grades across all assessments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search students..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterClass} onValueChange={setFilterClass}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    <SelectItem value="Mathematics 101">Mathematics 101</SelectItem>
                    <SelectItem value="English Literature">English Literature</SelectItem>
                    <SelectItem value="Biology Fundamentals">Biology Fundamentals</SelectItem>
                    <SelectItem value="World History">World History</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterGradeRange} onValueChange={setFilterGradeRange}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by grade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Grades</SelectItem>
                    <SelectItem value="A">A (90-100%)</SelectItem>
                    <SelectItem value="B">B (80-89%)</SelectItem>
                    <SelectItem value="C">C (70-79%)</SelectItem>
                    <SelectItem value="D">D (60-69%)</SelectItem>
                    <SelectItem value="F">F (Below 60%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Assignments</TableHead>
                      <TableHead>Quizzes</TableHead>
                      <TableHead>Midterm</TableHead>
                      <TableHead>Final</TableHead>
                      <TableHead>Participation</TableHead>
                      <TableHead>Overall</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>GPA</TableHead>
                      <TableHead>Trend</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredGrades.map((grade) => (
                      <TableRow key={grade.id}>
                        <TableCell className="font-medium">
                          <div>
                            <div>{grade.studentName}</div>
                            <div className="text-sm text-gray-500">{grade.studentId}</div>
                          </div>
                        </TableCell>
                        <TableCell>{grade.class}</TableCell>
                        <TableCell>{grade.assignments}%</TableCell>
                        <TableCell>{grade.quizzes}%</TableCell>
                        <TableCell>{grade.midterm}%</TableCell>
                        <TableCell>{grade.final}%</TableCell>
                        <TableCell>{grade.participation}%</TableCell>
                        <TableCell className="font-semibold">{grade.overall}%</TableCell>
                        <TableCell>{getGradeBadge(grade.letterGrade, grade.overall)}</TableCell>
                        <TableCell>{grade.gpa}</TableCell>
                        <TableCell>{getTrendIcon(grade.trend)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Grades
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <FileText className="mr-2 h-4 w-4" />
                                Generate Report
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Download className="mr-2 h-4 w-4" />
                                Export Data
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Grade Distribution</CardTitle>
                <CardDescription>Distribution of letter grades across all classes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>A (90-100%)</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div className="bg-emerald-600 h-2 rounded-full" style={{ width: "35%" }}></div>
                      </div>
                      <span className="text-sm">35%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>B (80-89%)</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: "40%" }}></div>
                      </div>
                      <span className="text-sm">40%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>C (70-79%)</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div className="bg-yellow-600 h-2 rounded-full" style={{ width: "20%" }}></div>
                      </div>
                      <span className="text-sm">20%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>D (60-69%)</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div className="bg-orange-600 h-2 rounded-full" style={{ width: "4%" }}></div>
                      </div>
                      <span className="text-sm">4%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>F (Below 60%)</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div className="bg-red-600 h-2 rounded-full" style={{ width: "1%" }}></div>
                      </div>
                      <span className="text-sm">1%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
                <CardDescription>Student performance trends over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-emerald-600" />
                      <span className="font-medium">Improving</span>
                    </div>
                    <span className="text-emerald-600 font-semibold">68 students</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 bg-gray-400 rounded-full"></div>
                      <span className="font-medium">Stable</span>
                    </div>
                    <span className="text-gray-600 font-semibold">82 students</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-5 w-5 text-red-600" />
                      <span className="font-medium">Declining</span>
                    </div>
                    <span className="text-red-600 font-semibold">12 students</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Grade Reports</CardTitle>
              <CardDescription>Generate and download various grade reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <FileText className="h-8 w-8 text-emerald-600" />
                    <div>
                      <h3 className="font-semibold">Progress Reports</h3>
                      <p className="text-sm text-gray-600">Individual student progress</p>
                    </div>
                  </div>
                  <Button className="w-full bg-transparent" variant="outline">
                    Generate Report
                  </Button>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <BarChart3 className="h-8 w-8 text-blue-600" />
                    <div>
                      <h3 className="font-semibold">Class Analytics</h3>
                      <p className="text-sm text-gray-600">Class performance overview</p>
                    </div>
                  </div>
                  <Button className="w-full bg-transparent" variant="outline">
                    Generate Report
                  </Button>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Award className="h-8 w-8 text-yellow-600" />
                    <div>
                      <h3 className="font-semibold">Honor Roll</h3>
                      <p className="text-sm text-gray-600">High-achieving students</p>
                    </div>
                  </div>
                  <Button className="w-full bg-transparent" variant="outline">
                    Generate Report
                  </Button>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Users className="h-8 w-8 text-purple-600" />
                    <div>
                      <h3 className="font-semibold">Parent Reports</h3>
                      <p className="text-sm text-gray-600">Reports for parent communication</p>
                    </div>
                  </div>
                  <Button className="w-full bg-transparent" variant="outline">
                    Generate Report
                  </Button>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <BookOpen className="h-8 w-8 text-red-600" />
                    <div>
                      <h3 className="font-semibold">Transcripts</h3>
                      <p className="text-sm text-gray-600">Official academic transcripts</p>
                    </div>
                  </div>
                  <Button className="w-full bg-transparent" variant="outline">
                    Generate Report
                  </Button>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Calculator className="h-8 w-8 text-green-600" />
                    <div>
                      <h3 className="font-semibold">GPA Reports</h3>
                      <p className="text-sm text-gray-600">Grade point average analysis</p>
                    </div>
                  </div>
                  <Button className="w-full bg-transparent" variant="outline">
                    Generate Report
                  </Button>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
