// This file contains all data and CRUD operations in one place for easy replacement

// ==================== DATA STRUCTURES ====================

export interface User {
  id: number
  name: string
  email: string
  role: "student" | "teacher" | "admin"
  grade?: string
  subject?: string
  department?: string
  status: "active" | "inactive"
  avatar?: string
}

export interface Class {
  id: number
  name: string
  teacher: string
  teacherId?: number
  students: number
  capacity: number
  schedule: string
  room: string
  subject?: string
  description?: string
}

export interface Assignment {
  id: number
  title: string
  description: string
  subject: string
  dueDate: string
  dueTime: string
  points: number
  status: "submitted" | "in-progress" | "not-started" | "overdue"
  submittedAt?: string | null
  grade?: number | null
  feedback?: string | null
  attachments: string[]
  submissionFiles: string[]
  classId?: number
}

export interface Quiz {
  id: number
  title: string
  description: string
  type: "multiple-choice" | "reading-video" | "typing"
  module: string
  questions: number
  timeLimit: number
  attempts: number
  maxAttempts: number
  bestScore?: number | null
  status: "completed" | "in-progress" | "available" | "locked"
  dueDate: string
  difficulty: "Easy" | "Medium" | "Hard"
  points: number
  videoUrl?: string
  readingMaterial?: string
  classId?: number
}

export interface DiscussionPost {
  id: number
  title: string
  description: string
  author: string
  authorRole: "Teacher" | "Student" | "Admin"
  createdAt: string
  replies: number
  lastActivity: string
  isPinned: boolean
  category: string
  views: number
  classId?: number
}

export interface Lesson {
  id: number
  title: string
  class: string
  classId?: number
  duration: string
  status: "published" | "draft" | "archived"
  views: number
  content?: string
  videoUrl?: string
  materials?: string[]
}

export interface Grade {
  id: number
  student: string
  studentId?: number
  class: string
  classId?: number
  assignment: string
  assignmentId?: number
  score: number
  maxScore: number
  date: string
  category?: string
}

export interface Announcement {
  id: number
  title: string
  content: string
  date: string
  priority: "high" | "medium" | "low"
  author?: string
  classId?: number
}

// Adding notification interface
export interface Notification {
  id: number
  title: string
  message: string
  type: "assignment" | "grade" | "announcement" | "discussion" | "system"
  priority: "high" | "medium" | "low"
  isRead: boolean
  createdAt: string
  userId?: number
  classId?: number
  relatedId?: number // ID of related assignment, grade, etc.
  actionUrl?: string // URL to navigate to when clicked
}

export interface Course {
  id: string
  title: string
  description: string
  instructor: string
  instructorId?: number
  schedule: string
  status: "active" | "completed" | "upcoming"
  progress: number
  students: number
  maxStudents: number
  startDate: string
  endDate: string
  subject: string
}

export interface Survey {
  id: string
  title: string
  description: string
  status: "pending" | "completed" | "draft"
  dueDate: string
  responses: number
  maxResponses?: number
  questions: number
  estimatedTime: number
  courseId?: string
}

export interface Update {
  id: string
  title: string
  description: string
  author: string
  date: string
  category: "course" | "platform" | "announcement" | "system"
  read: boolean
  link?: string
  priority: "high" | "medium" | "low"
}

export interface Instructor {
  id: string
  name: string
  title: string
  email: string
  phone: string
  office: string
  rating: number
  courses: string[]
  bio?: string
  officeHours?: string
  specialties?: string[]
}

export interface Module {
  id: number
  title: string
  description: string
  courseId: number
  courseName: string
  order: number
  lessons: ModuleLesson[]
  totalDuration: string
  progress: number
  status: "locked" | "available" | "in-progress" | "completed"
  unlockDate?: string
}

export interface ModuleLesson {
  id: number
  moduleId: number
  title: string
  description: string
  type: "video" | "reading" | "interactive" | "quiz" | "assignment"
  duration: string
  order: number
  content: string
  videoUrl?: string
  materials?: string[]
  completed: boolean
  locked: boolean
  notes?: string
}

// ==================== DATABASE STORAGE ====================

const database = {
  users: [
    {
      id: 1,
      name: "John Smith",
      email: "john.smith@maatk12.edu",
      role: "student" as const,
      grade: "10th",
      status: "active" as const,
    },
    {
      id: 2,
      name: "Sarah Johnson",
      email: "sarah.johnson@maatk12.edu",
      role: "teacher" as const,
      subject: "Mathematics",
      status: "active" as const,
    },
    {
      id: 3,
      name: "Mike Davis",
      email: "mike.davis@maatk12.edu",
      role: "admin" as const,
      department: "IT",
      status: "active" as const,
    },
    {
      id: 4,
      name: "Emily Wilson",
      email: "emily.wilson@maatk12.edu",
      role: "student" as const,
      grade: "11th",
      status: "active" as const,
    },
    {
      id: 5,
      name: "Robert Brown",
      email: "robert.brown@maatk12.edu",
      role: "teacher" as const,
      subject: "Science",
      status: "active" as const,
    },
    {
      id: 6,
      name: "Lisa Davis",
      email: "lisa.davis@maatk12.edu",
      role: "teacher" as const,
      subject: "English",
      status: "active" as const,
    },
    {
      id: 7,
      name: "Mark Wilson",
      email: "mark.wilson@maatk12.edu",
      role: "teacher" as const,
      subject: "History",
      status: "active" as const,
    },
  ] as User[],

  classes: [
    {
      id: 1,
      name: "Advanced Mathematics",
      teacher: "Sarah Johnson",
      teacherId: 2,
      students: 28,
      capacity: 30,
      schedule: "MWF 10:00-11:00",
      room: "A101",
      subject: "Mathematics",
    },
    {
      id: 2,
      name: "Biology Lab",
      teacher: "Robert Brown",
      teacherId: 5,
      students: 24,
      capacity: 25,
      schedule: "TTh 2:00-3:30",
      room: "B205",
      subject: "Science",
    },
    {
      id: 3,
      name: "English Literature",
      teacher: "Lisa Davis",
      teacherId: 6,
      students: 22,
      capacity: 25,
      schedule: "MWF 1:00-2:00",
      room: "C103",
      subject: "English",
    },
    {
      id: 4,
      name: "World History",
      teacher: "Mark Wilson",
      teacherId: 7,
      students: 26,
      capacity: 30,
      schedule: "TTh 9:00-10:30",
      room: "D201",
      subject: "History",
    },
  ] as Class[],

  assignments: [
    {
      id: 1,
      title: "Algebra Problem Set #3",
      description: "Complete problems 1-20 from Chapter 3. Show all work and explain your reasoning for each solution.",
      subject: "Mathematics",
      dueDate: "2024-12-20",
      dueTime: "11:59 PM",
      points: 100,
      status: "submitted" as const,
      submittedAt: "2024-12-18 10:30 AM",
      grade: 85,
      feedback: "Good work! Pay attention to step 3 in problem 15.",
      attachments: ["algebra_problems_ch3.pdf"],
      submissionFiles: ["john_algebra_hw3.pdf"],
      classId: 1,
    },
    {
      id: 2,
      title: "Linear Equations Essay",
      description:
        "Write a 500-word essay explaining real-world applications of linear equations. Include at least 3 examples with detailed explanations.",
      subject: "Mathematics",
      dueDate: "2024-12-22",
      dueTime: "11:59 PM",
      points: 75,
      status: "in-progress" as const,
      submittedAt: null,
      grade: null,
      feedback: null,
      attachments: ["essay_guidelines.pdf", "example_applications.pdf"],
      submissionFiles: [],
      classId: 1,
    },
    {
      id: 3,
      title: "Quadratic Functions Project",
      description:
        "Create a presentation on quadratic functions including graphs, real-world examples, and interactive demonstrations.",
      subject: "Mathematics",
      dueDate: "2024-12-25",
      dueTime: "11:59 PM",
      points: 150,
      status: "not-started" as const,
      submittedAt: null,
      grade: null,
      feedback: null,
      attachments: ["project_rubric.pdf", "presentation_template.pptx"],
      submissionFiles: [],
      classId: 1,
    },
    {
      id: 4,
      title: "Chapter 2 Review Worksheet",
      description:
        "Complete the review worksheet covering all topics from Chapter 2. This will help prepare for the upcoming quiz.",
      subject: "Mathematics",
      dueDate: "2024-12-19",
      dueTime: "11:59 PM",
      points: 50,
      status: "overdue" as const,
      submittedAt: null,
      grade: null,
      feedback: null,
      attachments: ["chapter2_review.pdf"],
      submissionFiles: [],
      classId: 1,
    },
  ] as Assignment[],

  quizzes: [
    {
      id: 1,
      title: "Chapter 3: Algebra Fundamentals Quiz",
      description: "Test your understanding of basic algebra concepts including variables, constants, and operations.",
      type: "multiple-choice" as const,
      module: "Multiple Choice Module",
      questions: 15,
      timeLimit: 30,
      attempts: 2,
      maxAttempts: 3,
      bestScore: 85,
      status: "completed" as const,
      dueDate: "2024-12-20",
      difficulty: "Medium" as const,
      points: 100,
      classId: 1,
    },
    {
      id: 2,
      title: "Linear Equations Reading Comprehension",
      description:
        "Watch the instructional video and answer questions about linear equations and their real-world applications.",
      type: "reading-video" as const,
      module: "Reading with Video Module",
      questions: 8,
      timeLimit: 45,
      attempts: 0,
      maxAttempts: 2,
      bestScore: null,
      status: "available" as const,
      dueDate: "2024-12-22",
      difficulty: "Easy" as const,
      points: 75,
      videoUrl: "/videos/linear-equations.mp4",
      readingMaterial: "Linear equations are mathematical expressions...",
      classId: 1,
    },
    {
      id: 3,
      title: "Quadratic Functions Essay Questions",
      description: "Demonstrate your understanding through written explanations and problem-solving steps.",
      type: "typing" as const,
      module: "Typing Module",
      questions: 5,
      timeLimit: 60,
      attempts: 1,
      maxAttempts: 2,
      bestScore: 78,
      status: "in-progress" as const,
      dueDate: "2024-12-25",
      difficulty: "Hard" as const,
      points: 120,
      classId: 1,
    },
    {
      id: 4,
      title: "Mid-term Practice Quiz",
      description: "Comprehensive review covering all topics from Chapters 1-3.",
      type: "multiple-choice" as const,
      module: "Multiple Choice Module",
      questions: 25,
      timeLimit: 50,
      attempts: 0,
      maxAttempts: 1,
      bestScore: null,
      status: "locked" as const,
      dueDate: "2024-12-28",
      difficulty: "Hard" as const,
      points: 150,
      classId: 1,
    },
  ] as Quiz[],

  discussionPosts: [
    {
      id: 1,
      title: "Welcome to Mathematics Discussion Forum",
      description:
        "This is our main discussion space for Mathematics Grade 10. Please introduce yourself and share your learning goals for this semester. Feel free to ask questions about any topic we'll be covering.",
      author: "Dr. Sarah Johnson",
      authorRole: "Teacher" as const,
      createdAt: "2 days ago",
      replies: 24,
      lastActivity: "3 hours ago",
      isPinned: true,
      category: "General",
      views: 156,
      classId: 1,
    },
    {
      id: 2,
      title: "Chapter 3: Algebra Fundamentals - Questions & Discussion",
      description:
        "Let's discuss the key concepts from Chapter 3. If you're having trouble with any of the algebra problems, post them here and we'll work through them together. Remember to show your work!",
      author: "Dr. Sarah Johnson",
      authorRole: "Teacher" as const,
      createdAt: "1 day ago",
      replies: 18,
      lastActivity: "1 hour ago",
      isPinned: false,
      category: "Course Content",
      views: 89,
      classId: 1,
    },
    {
      id: 3,
      title: "Study Group Formation for Midterm Exam",
      description:
        "Hi everyone! I'm looking to form a study group for the upcoming midterm exam. We can meet virtually or in person. Who's interested in joining? Let's help each other succeed!",
      author: "Alex Chen",
      authorRole: "Student" as const,
      createdAt: "6 hours ago",
      replies: 12,
      lastActivity: "30 minutes ago",
      isPinned: false,
      category: "Study Groups",
      views: 45,
      classId: 1,
    },
    {
      id: 4,
      title: "Linear Equations Practice Problems - Need Help!",
      description:
        "I'm struggling with some of the linear equation problems from yesterday's lesson. Specifically problems 15-18 from the textbook. Can someone explain the step-by-step process?",
      author: "Maria Rodriguez",
      authorRole: "Student" as const,
      createdAt: "4 hours ago",
      replies: 8,
      lastActivity: "45 minutes ago",
      isPinned: false,
      category: "Homework Help",
      views: 32,
      classId: 1,
    },
    {
      id: 5,
      title: "Real-World Applications of Algebra",
      description:
        "I'd love to hear about how you've seen algebra used in real life! Share examples from your experiences or interesting applications you've discovered. This will help us all see the practical value of what we're learning.",
      author: "Dr. Sarah Johnson",
      authorRole: "Teacher" as const,
      createdAt: "3 days ago",
      replies: 31,
      lastActivity: "2 hours ago",
      isPinned: false,
      category: "General",
      views: 198,
      classId: 1,
    },
  ] as DiscussionPost[],

  lessons: [
    {
      id: 1,
      title: "Introduction to Algebra",
      class: "Advanced Mathematics",
      classId: 1,
      duration: "50 min",
      status: "published" as const,
      views: 156,
      content:
        "Learn the fundamentals of algebraic expressions and equations. This lesson covers variables, constants, and basic operations.",
      videoUrl: "/videos/algebra-intro.mp4",
      materials: ["Algebra Workbook Chapter 1", "Practice Problems Set A", "Formula Reference Sheet"],
    },
    {
      id: 2,
      title: "Cell Structure",
      class: "Biology Lab",
      classId: 2,
      duration: "90 min",
      status: "published" as const,
      views: 234,
      content: "Explore the basic structure of plant and animal cells. Learn about organelles and their functions.",
      videoUrl: "/videos/cell-structure.mp4",
      materials: ["Cell Diagram Worksheet", "Microscope Lab Guide", "Cell Parts Quiz"],
    },
    {
      id: 3,
      title: "Shakespeare's Sonnets",
      class: "English Literature",
      classId: 3,
      duration: "45 min",
      status: "published" as const,
      views: 189,
      content: "Analyze the structure and themes of Shakespeare's sonnets. Focus on Sonnet 18 and Sonnet 130.",
      materials: ["Sonnet Collection PDF", "Literary Analysis Guide", "Poetry Terms Glossary"],
    },
    {
      id: 4,
      title: "World War II Timeline",
      class: "World History",
      classId: 4,
      duration: "60 min",
      status: "published" as const,
      views: 167,
      content: "Study the major events and timeline of World War II from 1939-1945.",
      videoUrl: "/videos/wwii-timeline.mp4",
      materials: ["WWII Timeline Chart", "Primary Source Documents", "Map Activities"],
    },
    {
      id: 5,
      title: "Linear Equations",
      class: "Advanced Mathematics",
      classId: 1,
      duration: "55 min",
      status: "published" as const,
      views: 143,
      content:
        "Master solving linear equations in one variable. Learn graphing techniques and real-world applications.",
      videoUrl: "/videos/linear-equations.mp4",
      materials: ["Graphing Paper", "Linear Equations Worksheet", "Calculator Guide"],
    },
    {
      id: 6,
      title: "Photosynthesis Process",
      class: "Biology Lab",
      classId: 2,
      duration: "75 min",
      status: "published" as const,
      views: 198,
      content: "Understand the process of photosynthesis and its importance in ecosystems.",
      videoUrl: "/videos/photosynthesis.mp4",
      materials: ["Photosynthesis Diagram", "Lab Equipment List", "Observation Sheet"],
    },
  ] as Lesson[],

  grades: [
    {
      id: 1,
      student: "John Smith",
      studentId: 1,
      class: "Advanced Mathematics",
      classId: 1,
      assignment: "Midterm Exam",
      assignmentId: 1,
      score: 85,
      maxScore: 100,
      date: "2024-01-10",
    },
    {
      id: 2,
      student: "Emily Wilson",
      studentId: 4,
      class: "Biology Lab",
      classId: 2,
      assignment: "Lab Report #3",
      score: 92,
      maxScore: 100,
      date: "2024-01-12",
    },
    {
      id: 3,
      student: "John Smith",
      studentId: 1,
      class: "English Literature",
      classId: 3,
      assignment: "Essay Analysis",
      score: 78,
      maxScore: 100,
      date: "2024-01-08",
    },
    {
      id: 4,
      student: "Emily Wilson",
      studentId: 4,
      class: "World History",
      classId: 4,
      assignment: "Research Project",
      score: 95,
      maxScore: 100,
      date: "2024-01-15",
    },
  ] as Grade[],

  announcements: [
    {
      id: 1,
      title: "Winter Break Schedule",
      content: "Classes will resume on January 8th",
      date: "2024-01-02",
      priority: "high" as const,
    },
    {
      id: 2,
      title: "Library Hours Extended",
      content: "Library now open until 8 PM",
      date: "2024-01-05",
      priority: "medium" as const,
    },
    {
      id: 3,
      title: "Science Fair Registration",
      content: "Register by January 20th",
      date: "2024-01-03",
      priority: "medium" as const,
    },
  ] as Announcement[],

  notifications: [
    {
      id: 1,
      title: "New Assignment Posted",
      message: "Linear Equations Essay has been assigned",
      type: "assignment" as const,
      priority: "medium" as const,
      isRead: false,
      createdAt: "2024-01-15T10:30:00Z",
      userId: 1,
      classId: 1,
      relatedId: 2,
      actionUrl: "/classrooms/assignments/2",
    },
    {
      id: 2,
      title: "Grade Posted",
      message: "Your Algebra Problem Set #3 has been graded",
      type: "grade" as const,
      priority: "high" as const,
      isRead: false,
      createdAt: "2024-01-15T09:15:00Z",
      userId: 1,
      classId: 1,
      relatedId: 1,
      actionUrl: "/classrooms/grades",
    },
    {
      id: 3,
      title: "New Discussion Reply",
      message: "Dr. Johnson replied to your question about linear equations",
      type: "discussion" as const,
      priority: "medium" as const,
      isRead: true,
      createdAt: "2024-01-15T08:45:00Z",
      userId: 1,
      classId: 1,
      relatedId: 4,
      actionUrl: "/classrooms/discussions/4",
    },
    {
      id: 4,
      title: "Assignment Due Soon",
      message: "Quadratic Functions Project is due in 2 days",
      type: "assignment" as const,
      priority: "high" as const,
      isRead: false,
      createdAt: "2024-01-15T07:00:00Z",
      userId: 1,
      classId: 1,
      relatedId: 3,
      actionUrl: "/classrooms/assignments/3",
    },
    {
      id: 5,
      title: "System Maintenance",
      message: "Scheduled maintenance tonight from 11 PM to 1 AM",
      type: "system" as const,
      priority: "low" as const,
      isRead: false,
      createdAt: "2024-01-15T06:30:00Z",
      actionUrl: "/help",
    },
  ] as Notification[],

  courses: [
    {
      id: "math-101",
      title: "Advanced Mathematics",
      description: "Comprehensive mathematics course covering algebra, geometry, and calculus fundamentals.",
      instructor: "Dr. Sarah Johnson",
      instructorId: 2,
      schedule: "MWF 10:00-11:00 AM",
      status: "active" as const,
      progress: 65,
      students: 28,
      maxStudents: 30,
      startDate: "2024-01-15",
      endDate: "2024-05-15",
      subject: "Mathematics",
    },
    {
      id: "bio-201",
      title: "Biology Laboratory",
      description: "Hands-on biology lab focusing on cellular biology, genetics, and molecular processes.",
      instructor: "Dr. Robert Brown",
      instructorId: 5,
      schedule: "TTh 2:00-3:30 PM",
      status: "active" as const,
      progress: 45,
      students: 24,
      maxStudents: 25,
      startDate: "2024-01-15",
      endDate: "2024-05-15",
      subject: "Science",
    },
    {
      id: "eng-301",
      title: "English Literature",
      description: "Exploration of classic and contemporary literature with focus on critical analysis.",
      instructor: "Dr. Lisa Davis",
      instructorId: 6,
      schedule: "MWF 1:00-2:00 PM",
      status: "active" as const,
      progress: 78,
      students: 22,
      maxStudents: 25,
      startDate: "2024-01-15",
      endDate: "2024-05-15",
      subject: "English",
    },
    {
      id: "hist-401",
      title: "World History",
      description: "Comprehensive study of world civilizations and historical events.",
      instructor: "Dr. Mark Wilson",
      instructorId: 7,
      schedule: "TTh 9:00-10:30 AM",
      status: "upcoming" as const,
      progress: 0,
      students: 26,
      maxStudents: 30,
      startDate: "2024-02-01",
      endDate: "2024-06-01",
      subject: "History",
    },
  ] as Course[],

  surveys: [
    {
      id: "survey-001",
      title: "Course Satisfaction Survey",
      description: "Help us improve your learning experience by providing feedback on course content and delivery.",
      status: "pending" as const,
      dueDate: "December 25, 2024",
      responses: 156,
      maxResponses: 200,
      questions: 15,
      estimatedTime: 10,
      courseId: "math-101",
    },
    {
      id: "survey-002",
      title: "Learning Style Assessment",
      description: "Discover your preferred learning style to optimize your study approach.",
      status: "completed" as const,
      dueDate: "December 20, 2024",
      responses: 89,
      maxResponses: 100,
      questions: 20,
      estimatedTime: 15,
    },
    {
      id: "survey-003",
      title: "Technology Usage Survey",
      description: "Share your experience with our digital learning tools and suggest improvements.",
      status: "pending" as const,
      dueDate: "December 30, 2024",
      responses: 45,
      questions: 12,
      estimatedTime: 8,
      courseId: "bio-201",
    },
    {
      id: "survey-004",
      title: "Campus Facilities Feedback",
      description: "Rate and provide feedback on campus facilities and services.",
      status: "draft" as const,
      dueDate: "January 15, 2025",
      responses: 0,
      questions: 18,
      estimatedTime: 12,
    },
  ] as Survey[],

  updates: [
    {
      id: "update-001",
      title: "New Assignment Posted: Linear Equations Essay",
      description:
        "A new assignment has been posted for your Mathematics course. Please review the requirements and submit by the due date.",
      author: "Dr. Sarah Johnson",
      date: "December 18, 2024",
      category: "course" as const,
      read: false,
      link: "/classrooms/assignments/2",
      priority: "medium" as const,
    },
    {
      id: "update-002",
      title: "Platform Maintenance Scheduled",
      description:
        "The learning platform will undergo scheduled maintenance this weekend. Some features may be temporarily unavailable.",
      author: "System Administrator",
      date: "December 17, 2024",
      category: "platform" as const,
      read: true,
      link: "/help",
      priority: "high" as const,
    },
    {
      id: "update-003",
      title: "Grade Posted for Algebra Problem Set #3",
      description:
        "Your grade for the recent algebra assignment has been posted. Check your grades section for detailed feedback.",
      author: "Dr. Sarah Johnson",
      date: "December 16, 2024",
      category: "course" as const,
      read: false,
      link: "/classrooms/grades",
      priority: "medium" as const,
    },
    {
      id: "update-004",
      title: "New Discussion Topic: Real-World Applications",
      description:
        "Join the discussion about real-world applications of algebra. Share your examples and learn from classmates.",
      author: "Dr. Sarah Johnson",
      date: "December 15, 2024",
      category: "course" as const,
      read: true,
      link: "/classrooms/discussions/5",
      priority: "low" as const,
    },
  ] as Update[],

  instructors: [
    {
      id: "instructor-001",
      name: "Dr. Sarah Johnson",
      title: "Professor of Mathematics",
      email: "sarah.johnson@maatk12.edu",
      phone: "(555) 123-4567",
      office: "Math Building, Room 201",
      rating: 4.8,
      courses: ["Advanced Mathematics", "Calculus I", "Statistics"],
      bio: "Dr. Johnson has over 15 years of experience teaching mathematics at the high school and college level.",
      officeHours: "MWF 2:00-4:00 PM",
      specialties: ["Algebra", "Calculus", "Statistics"],
    },
    {
      id: "instructor-002",
      name: "Dr. Robert Brown",
      title: "Professor of Biology",
      email: "robert.brown@maatk12.edu",
      phone: "(555) 234-5678",
      office: "Science Building, Room 305",
      rating: 4.6,
      courses: ["Biology Laboratory", "AP Biology", "Environmental Science"],
      bio: "Dr. Brown specializes in cellular biology and has published numerous research papers in molecular biology.",
      officeHours: "TTh 1:00-3:00 PM",
      specialties: ["Cell Biology", "Genetics", "Molecular Biology"],
    },
    {
      id: "instructor-003",
      name: "Dr. Lisa Davis",
      title: "Professor of English Literature",
      email: "lisa.davis@maatk12.edu",
      phone: "(555) 345-6789",
      office: "Humanities Building, Room 150",
      rating: 4.9,
      courses: ["English Literature", "Creative Writing", "AP English"],
      bio: "Dr. Davis is an award-winning author and has been teaching literature for over 12 years.",
      officeHours: "MW 3:00-5:00 PM",
      specialties: ["Shakespeare", "Modern Literature", "Creative Writing"],
    },
    {
      id: "instructor-004",
      name: "Dr. Mark Wilson",
      title: "Professor of History",
      email: "mark.wilson@maatk12.edu",
      phone: "(555) 456-7890",
      office: "Social Studies Building, Room 120",
      rating: 4.7,
      courses: ["World History", "American History", "Government"],
      bio: "Dr. Wilson holds a PhD in World History and has traveled extensively for historical research.",
      officeHours: "TTh 11:00 AM-1:00 PM",
      specialties: ["World War History", "Ancient Civilizations", "Political History"],
    },
  ] as Instructor[],

  modules: [
    // Math Course Modules
    {
      id: 1,
      title: "Algebra Fundamentals",
      description: "Master the basics of algebraic thinking and problem-solving",
      courseId: 1,
      courseName: "Advanced Mathematics",
      order: 1,
      totalDuration: "4 hours 30 minutes",
      progress: 75,
      status: "in-progress" as const,
      lessons: [
        {
          id: 101,
          moduleId: 1,
          title: "Variables and Constants",
          description: "Learn to identify and work with variables and constants",
          type: "video" as const,
          duration: "25 min",
          order: 1,
          content:
            "Variables are symbols that represent unknown values, while constants are fixed values. In this lesson, we'll explore how to use both in algebraic expressions.",
          videoUrl: "/videos/variables-constants.mp4",
          materials: ["Variable Practice Sheet", "Constants Reference"],
          completed: true,
          locked: false,
          notes: "Remember: variables can change, constants cannot!",
        },
        {
          id: 102,
          moduleId: 1,
          title: "Basic Operations",
          description: "Addition, subtraction, multiplication, and division with variables",
          type: "interactive" as const,
          duration: "30 min",
          order: 2,
          content:
            "Practice the four basic operations using algebraic expressions. Learn the order of operations (PEMDAS) and how to simplify expressions.",
          materials: ["Operations Worksheet", "PEMDAS Reference Card"],
          completed: true,
          locked: false,
        },
        {
          id: 103,
          moduleId: 1,
          title: "Solving Simple Equations",
          description: "Step-by-step approach to solving basic equations",
          type: "video" as const,
          duration: "35 min",
          order: 3,
          content:
            "Learn systematic approaches to solving equations. We'll cover isolation techniques and checking your answers.",
          videoUrl: "/videos/solving-equations.mp4",
          materials: ["Equation Practice Problems", "Solution Steps Guide"],
          completed: false,
          locked: false,
        },
        {
          id: 104,
          moduleId: 1,
          title: "Practice Quiz",
          description: "Test your understanding of algebra fundamentals",
          type: "quiz" as const,
          duration: "20 min",
          order: 4,
          content:
            "Complete this quiz to demonstrate your mastery of variables, operations, and basic equation solving.",
          completed: false,
          locked: false,
        },
      ],
    },
    {
      id: 4,
      title: "Geometry Essentials",
      description: "Explore shapes, angles, and spatial relationships",
      courseId: 1,
      courseName: "Advanced Mathematics",
      order: 2,
      totalDuration: "5 hours 15 minutes",
      progress: 30,
      status: "available" as const,
      lessons: [
        {
          id: 401,
          moduleId: 4,
          title: "Points, Lines, and Planes",
          description: "Understanding basic geometric elements",
          type: "video" as const,
          duration: "30 min",
          order: 1,
          content: "Learn the fundamental building blocks of geometry: points, lines, and planes.",
          videoUrl: "/videos/geometry-basics.mp4",
          materials: ["Geometry Definitions", "Visual Examples"],
          completed: true,
          locked: false,
        },
        {
          id: 402,
          moduleId: 4,
          title: "Angles and Their Properties",
          description: "Types of angles and angle relationships",
          type: "interactive" as const,
          duration: "45 min",
          order: 2,
          content: "Explore acute, obtuse, right angles and their relationships in geometric figures.",
          materials: ["Angle Measurement Tool", "Practice Problems"],
          completed: false,
          locked: false,
        },
        {
          id: 403,
          moduleId: 4,
          title: "Triangle Properties",
          description: "Understanding different types of triangles",
          type: "reading" as const,
          duration: "25 min",
          order: 3,
          content: "Study equilateral, isosceles, and scalene triangles and their unique properties.",
          materials: ["Triangle Classification Chart", "Property Summary"],
          completed: false,
          locked: false,
        },
      ],
    },
    {
      id: 5,
      title: "Introduction to Calculus",
      description: "Basic concepts of limits, derivatives, and integrals",
      courseId: 1,
      courseName: "Advanced Mathematics",
      order: 3,
      totalDuration: "6 hours 45 minutes",
      progress: 0,
      status: "locked" as const,
      unlockDate: "2024-03-15",
      lessons: [
        {
          id: 501,
          moduleId: 5,
          title: "Understanding Limits",
          description: "Introduction to the concept of limits",
          type: "video" as const,
          duration: "40 min",
          order: 1,
          content: "Learn what limits are and why they're fundamental to calculus.",
          videoUrl: "/videos/limits-intro.mp4",
          materials: ["Limits Worksheet", "Graphical Examples"],
          completed: false,
          locked: true,
        },
      ],
    },

    // Biology Course Modules
    {
      id: 2,
      title: "Cell Biology Basics",
      description: "Explore the fundamental unit of life - the cell",
      courseId: 2,
      courseName: "Biology Lab",
      order: 1,
      totalDuration: "3 hours 45 minutes",
      progress: 60,
      status: "in-progress" as const,
      lessons: [
        {
          id: 201,
          moduleId: 2,
          title: "Cell Theory",
          description: "Understanding the three principles of cell theory",
          type: "reading" as const,
          duration: "20 min",
          order: 1,
          content:
            "Cell theory states that: 1) All living things are made of cells, 2) Cells are the basic unit of life, 3) All cells come from other cells.",
          materials: ["Cell Theory Reading", "Historical Timeline"],
          completed: true,
          locked: false,
        },
        {
          id: 202,
          moduleId: 2,
          title: "Plant vs Animal Cells",
          description: "Compare and contrast plant and animal cell structures",
          type: "video" as const,
          duration: "40 min",
          order: 2,
          content:
            "Examine the similarities and differences between plant and animal cells, focusing on unique organelles like chloroplasts and cell walls.",
          videoUrl: "/videos/plant-animal-cells.mp4",
          materials: ["Cell Comparison Chart", "Organelle Functions List"],
          completed: true,
          locked: false,
        },
        {
          id: 203,
          moduleId: 2,
          title: "Organelle Functions",
          description: "Deep dive into cellular organelles and their roles",
          type: "interactive" as const,
          duration: "45 min",
          order: 3,
          content:
            "Interactive exploration of organelles including nucleus, mitochondria, ribosomes, and more. Learn their specific functions and importance.",
          materials: ["Organelle Diagram", "Function Matching Activity"],
          completed: false,
          locked: false,
        },
      ],
    },
    {
      id: 6,
      title: "Genetics and Heredity",
      description: "Understanding how traits are passed from parents to offspring",
      courseId: 2,
      courseName: "Biology Lab",
      order: 2,
      totalDuration: "4 hours 20 minutes",
      progress: 25,
      status: "available" as const,
      lessons: [
        {
          id: 601,
          moduleId: 6,
          title: "DNA Structure",
          description: "The double helix and genetic information storage",
          type: "video" as const,
          duration: "35 min",
          order: 1,
          content: "Explore the structure of DNA and how genetic information is stored.",
          videoUrl: "/videos/dna-structure.mp4",
          materials: ["DNA Model Kit", "Base Pair Chart"],
          completed: true,
          locked: false,
        },
        {
          id: 602,
          moduleId: 6,
          title: "Mendel's Laws",
          description: "Basic principles of inheritance",
          type: "reading" as const,
          duration: "30 min",
          order: 2,
          content: "Study Gregor Mendel's experiments and the laws of inheritance.",
          materials: ["Punnett Square Guide", "Inheritance Patterns"],
          completed: false,
          locked: false,
        },
      ],
    },

    // English Course Modules
    {
      id: 3,
      title: "Shakespeare's Poetry",
      description: "Analyze the works of William Shakespeare",
      courseId: 3,
      courseName: "English Literature",
      order: 1,
      totalDuration: "2 hours 30 minutes",
      progress: 40,
      status: "available" as const,
      lessons: [
        {
          id: 301,
          moduleId: 3,
          title: "Sonnet Structure",
          description: "Learn the 14-line structure of Shakespearean sonnets",
          type: "reading" as const,
          duration: "25 min",
          order: 1,
          content:
            "Shakespearean sonnets follow a specific 14-line structure with three quatrains and a final couplet, using an ABAB CDCD EFEF GG rhyme scheme.",
          materials: ["Sonnet Structure Guide", "Rhyme Scheme Examples"],
          completed: true,
          locked: false,
        },
        {
          id: 302,
          moduleId: 3,
          title: "Sonnet 18 Analysis",
          description: "Close reading of 'Shall I compare thee to a summer's day?'",
          type: "video" as const,
          duration: "30 min",
          order: 2,
          content:
            "Detailed analysis of Shakespeare's famous Sonnet 18, exploring themes of beauty, time, and immortality through poetry.",
          videoUrl: "/videos/sonnet-18-analysis.mp4",
          materials: ["Sonnet 18 Text", "Literary Devices Worksheet"],
          completed: false,
          locked: false,
        },
      ],
    },
    {
      id: 7,
      title: "Modern American Literature",
      description: "Exploring 20th century American authors and themes",
      courseId: 3,
      courseName: "English Literature",
      order: 2,
      totalDuration: "3 hours 15 minutes",
      progress: 80,
      status: "in-progress" as const,
      lessons: [
        {
          id: 701,
          moduleId: 7,
          title: "The Great Gatsby Analysis",
          description: "Themes and symbolism in Fitzgerald's masterpiece",
          type: "reading" as const,
          duration: "45 min",
          order: 1,
          content: "Analyze the themes of the American Dream, wealth, and social class in The Great Gatsby.",
          materials: ["Chapter Summaries", "Symbol Analysis Guide"],
          completed: true,
          locked: false,
        },
        {
          id: 702,
          moduleId: 7,
          title: "To Kill a Mockingbird Discussion",
          description: "Social justice themes in Harper Lee's novel",
          type: "video" as const,
          duration: "40 min",
          order: 2,
          content: "Examine themes of prejudice, moral growth, and social inequality.",
          videoUrl: "/videos/mockingbird-themes.mp4",
          materials: ["Character Analysis", "Historical Context"],
          completed: true,
          locked: false,
        },
      ],
    },

    // History Course Modules
    {
      id: 8,
      title: "Ancient Civilizations",
      description: "Explore the rise and fall of ancient empires",
      courseId: 4,
      courseName: "World History",
      order: 1,
      totalDuration: "4 hours 0 minutes",
      progress: 0,
      status: "available" as const,
      lessons: [
        {
          id: 801,
          moduleId: 8,
          title: "Mesopotamian Civilizations",
          description: "The cradle of civilization",
          type: "video" as const,
          duration: "35 min",
          order: 1,
          content: "Study the Sumerians, Babylonians, and Assyrians in ancient Mesopotamia.",
          videoUrl: "/videos/mesopotamia.mp4",
          materials: ["Timeline Chart", "Map Activities"],
          completed: false,
          locked: false,
        },
        {
          id: 802,
          moduleId: 8,
          title: "Ancient Egypt",
          description: "Pharaohs, pyramids, and the Nile River",
          type: "interactive" as const,
          duration: "50 min",
          order: 2,
          content: "Explore ancient Egyptian society, religion, and achievements.",
          materials: ["Hieroglyphics Guide", "Pyramid Construction"],
          completed: false,
          locked: false,
        },
      ],
    },
  ] as Module[],
}

// ==================== CRUD FUNCTIONS ====================

// USERS
export const getUsers = (): User[] => database.users
export const getUserById = (id: number): User | undefined => database.users.find((u) => u.id === id)
export const createUser = (user: Omit<User, "id">): User => {
  const newUser = { ...user, id: Math.max(...database.users.map((u) => u.id)) + 1 }
  database.users.push(newUser)
  return newUser
}
export const updateUser = (id: number, updates: Partial<User>): User | null => {
  const index = database.users.findIndex((u) => u.id === id)
  if (index === -1) return null
  database.users[index] = { ...database.users[index], ...updates }
  return database.users[index]
}
export const deleteUser = (id: number): boolean => {
  const index = database.users.findIndex((u) => u.id === id)
  if (index === -1) return false
  database.users.splice(index, 1)
  return true
}

// CLASSES
export const getClasses = (): Class[] => database.classes
export const getClassById = (id: number): Class | undefined => database.classes.find((c) => c.id === id)
export const createClass = (classData: Omit<Class, "id">): Class => {
  const newClass = { ...classData, id: Math.max(...database.classes.map((c) => c.id)) + 1 }
  database.classes.push(newClass)
  return newClass
}

// ASSIGNMENTS
export const getAssignments = (): Assignment[] => database.assignments
export const getAssignmentById = (id: number): Assignment | undefined => database.assignments.find((a) => a.id === id)
export const createAssignment = (assignment: Omit<Assignment, "id">): Assignment => {
  const newAssignment = { ...assignment, id: Math.max(...database.assignments.map((a) => a.id)) + 1 }
  database.assignments.push(newAssignment)
  return newAssignment
}

// QUIZZES
export const getQuizzes = (): Quiz[] => database.quizzes
export const getQuizById = (id: number): Quiz | undefined => database.quizzes.find((q) => q.id === id)

// DISCUSSIONS
export const getDiscussionPosts = (): DiscussionPost[] => database.discussionPosts
export const getDiscussionPostById = (id: number): DiscussionPost | undefined =>
  database.discussionPosts.find((p) => p.id === id)

// LESSONS
export const getLessons = (): Lesson[] => database.lessons
export const getLessonById = (id: number): Lesson | undefined => database.lessons.find((l) => l.id === id)

// GRADES
export const getGrades = (): Grade[] => database.grades
export const getGradeById = (id: number): Grade | undefined => database.grades.find((g) => g.id === id)

// ANNOUNCEMENTS
export const getAnnouncements = (): Announcement[] => database.announcements

// NOTIFICATIONS
export const getNotifications = (): Notification[] => database.notifications
export const getNotificationsByUser = (userId: number): Notification[] => {
  return database.notifications.filter((notification) => notification.userId === userId)
}
export const getUnreadNotifications = (userId?: number): Notification[] => {
  if (userId) {
    return database.notifications.filter((notification) => notification.userId === userId && !notification.isRead)
  }
  return database.notifications.filter((notification) => !notification.isRead)
}
export const markNotificationAsRead = (id: number): boolean => {
  const notification = database.notifications.find((n) => n.id === id)
  if (notification) {
    notification.isRead = true
    return true
  }
  return false
}
export const markAllNotificationsAsRead = (userId?: number): boolean => {
  let updated = false
  database.notifications.forEach((notification) => {
    if (userId) {
      if (notification.userId === userId && !notification.isRead) {
        notification.isRead = true
        updated = true
      }
    } else if (!notification.isRead) {
      notification.isRead = true
      updated = true
    }
  })
  return updated
}
export const deleteNotification = (id: number): boolean => {
  const index = database.notifications.findIndex((n) => n.id === id)
  if (index === -1) return false
  database.notifications.splice(index, 1)
  return true
}
export const createNotification = (notification: Omit<Notification, "id">): Notification => {
  const newNotification = { ...notification, id: Math.max(...database.notifications.map((n) => n.id)) + 1 }
  database.notifications.push(newNotification)
  return newNotification
}

// COURSES
export const getCourses = (): Course[] => database.courses
export const getCourseById = (id: string): Course | undefined => database.courses.find((c) => c.id === id)

// SURVEYS
export const getSurveys = (): Survey[] => database.surveys
export const getSurveyById = (id: string): Survey | undefined => database.surveys.find((s) => s.id === id)

// UPDATES
export const getUpdates = (): Update[] => database.updates
export const getUpdateById = (id: string): Update | undefined => database.updates.find((u) => u.id === id)

// INSTRUCTORS
export const getInstructors = (): Instructor[] => database.instructors
export const getInstructorById = (id: string): Instructor | undefined => database.instructors.find((i) => i.id === id)

// MODULES
export const getModules = (): Module[] => database.modules
export const getModuleById = (id: number): Module | undefined => database.modules.find((m) => m.id === id)
export const getModulesByCourse = (courseId: number): Module[] =>
  database.modules.filter((m) => m.courseId === courseId)

// UTILITY FUNCTIONS
export const resetDatabase = (): void => {
  // This function can be used to reset the database to initial state
  console.log("Database reset functionality - implement as needed")
}

export const exportDatabase = (): string => {
  return JSON.stringify(database, null, 2)
}

export const importDatabase = (data: string): boolean => {
  try {
    const importedData = JSON.parse(data)
    // Validate structure before importing
    database.users = importedData.users || []
    database.classes = importedData.classes || []
    database.assignments = importedData.assignments || []
    // ... add other imports as needed
    return true
  } catch (error) {
    console.error("Failed to import database:", error)
    return false
  }
}
