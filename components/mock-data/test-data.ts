export const mockUsers = [
  { id: 1, name: "John Smith", email: "john.smith@maatk12.edu", role: "student", grade: "10th", status: "active" },
  {
    id: 2,
    name: "Sarah Johnson",
    email: "sarah.johnson@maatk12.edu",
    role: "teacher",
    subject: "Mathematics",
    status: "active",
  },
  { id: 3, name: "Mike Davis", email: "mike.davis@maatk12.edu", role: "admin", department: "IT", status: "active" },
  { id: 4, name: "Emily Wilson", email: "emily.wilson@maatk12.edu", role: "student", grade: "11th", status: "active" },
  {
    id: 5,
    name: "Robert Brown",
    email: "robert.brown@maatk12.edu",
    role: "teacher",
    subject: "Science",
    status: "active",
  },
]

export const mockClasses = [
  {
    id: 1,
    name: "Advanced Mathematics",
    teacher: "Sarah Johnson",
    students: 28,
    capacity: 30,
    schedule: "MWF 10:00-11:00",
    room: "A101",
  },
  {
    id: 2,
    name: "Biology Lab",
    teacher: "Robert Brown",
    students: 24,
    capacity: 25,
    schedule: "TTh 2:00-3:30",
    room: "B205",
  },
  {
    id: 3,
    name: "English Literature",
    teacher: "Lisa Davis",
    students: 22,
    capacity: 25,
    schedule: "MWF 1:00-2:00",
    room: "C103",
  },
  {
    id: 4,
    name: "World History",
    teacher: "Mark Wilson",
    students: 26,
    capacity: 30,
    schedule: "TTh 9:00-10:30",
    room: "D201",
  },
]

export const mockLessons = [
  {
    id: 1,
    title: "Introduction to Algebra",
    class: "Advanced Mathematics",
    duration: "50 min",
    status: "published",
    views: 156,
  },
  { id: 2, title: "Cell Structure", class: "Biology Lab", duration: "90 min", status: "draft", views: 0 },
  {
    id: 3,
    title: "Shakespeare's Sonnets",
    class: "English Literature",
    duration: "45 min",
    status: "published",
    views: 89,
  },
  {
    id: 4,
    title: "World War II Timeline",
    class: "World History",
    duration: "60 min",
    status: "published",
    views: 134,
  },
]

export const mockGrades = [
  {
    id: 1,
    student: "John Smith",
    class: "Advanced Mathematics",
    assignment: "Midterm Exam",
    score: 85,
    maxScore: 100,
    date: "2024-01-10",
  },
  {
    id: 2,
    student: "Emily Wilson",
    class: "Biology Lab",
    assignment: "Lab Report #3",
    score: 92,
    maxScore: 100,
    date: "2024-01-12",
  },
  {
    id: 3,
    student: "John Smith",
    class: "English Literature",
    assignment: "Essay Analysis",
    score: 78,
    maxScore: 100,
    date: "2024-01-08",
  },
  {
    id: 4,
    student: "Emily Wilson",
    class: "World History",
    assignment: "Research Project",
    score: 95,
    maxScore: 100,
    date: "2024-01-15",
  },
]

export const mockAnnouncements = [
  {
    id: 1,
    title: "Winter Break Schedule",
    content: "Classes will resume on January 8th",
    date: "2024-01-02",
    priority: "high",
  },
  {
    id: 2,
    title: "Library Hours Extended",
    content: "Library now open until 8 PM",
    date: "2024-01-05",
    priority: "medium",
  },
  {
    id: 3,
    title: "Science Fair Registration",
    content: "Register by January 20th",
    date: "2024-01-03",
    priority: "medium",
  },
]
