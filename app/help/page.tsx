"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  Search,
  BookOpen,
  MessageCircle,
  Phone,
  Mail,
  FileText,
  Video,
  Users,
  Settings,
  ExternalLink,
} from "lucide-react"

export default function HelpCenter() {
  const [searchTerm, setSearchTerm] = useState("")
  const [ticketSubject, setTicketSubject] = useState("")
  const [ticketCategory, setTicketCategory] = useState("Technical Issue")
  const [ticketDescription, setTicketDescription] = useState("")

  const faqItems = [
    {
      question: "How do I submit an assignment?",
      answer:
        "Navigate to the Assignments section, click on the assignment you want to submit, then use the file upload area to drag and drop your files or click 'Upload Files' to browse and select them.",
    },
    {
      question: "How can I check my grades?",
      answer:
        "Go to the Grades section in the main navigation. You'll see your overall grades, individual assignment scores, and detailed breakdowns by category.",
    },
    {
      question: "How do I join a discussion?",
      answer:
        "Visit the Discussions section, find the topic you want to participate in, and click on it. You can then reply to existing threads or start a new discussion thread.",
    },
    {
      question: "Can I download course materials?",
      answer:
        "Yes! In the Content section, look for the download icon next to materials. You can download PDFs, presentations, and other resources for offline viewing.",
    },
    {
      question: "How do I reset my password?",
      answer:
        "Click on your profile picture in the top right, go to Settings, then Account Settings. You'll find the option to change your password there.",
    },
  ]

  const supportCategories = [
    {
      title: "Getting Started",
      icon: <BookOpen className="h-6 w-6" />,
      articles: ["Platform Overview", "First Login", "Navigation Guide", "Setting Up Your Profile"],
    },
    {
      title: "Assignments & Grades",
      icon: <FileText className="h-6 w-6" />,
      articles: ["Submitting Assignments", "Viewing Grades", "Late Submission Policy", "Grade Calculations"],
    },
    {
      title: "Communication",
      icon: <MessageCircle className="h-6 w-6" />,
      articles: ["Discussion Forums", "Messaging Teachers", "Group Communications", "Notifications"],
    },
    {
      title: "Technical Support",
      icon: <Settings className="h-6 w-6" />,
      articles: ["Browser Requirements", "File Upload Issues", "Login Problems", "Mobile App"],
    },
  ]

  const handleSubmitTicket = () => {
    if (!ticketSubject || !ticketDescription) {
      alert("Please fill in all required fields")
      return
    }

    console.log("[v0] Submitting ticket:", { ticketSubject, ticketCategory, ticketDescription })
    // TODO: Integrate with actual ticketing system
    alert("Support ticket submitted successfully! We'll get back to you within 24 hours.")

    // Reset form
    setTicketSubject("")
    setTicketCategory("Technical Issue")
    setTicketDescription("")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">Help Center</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Find answers to common questions, browse help articles, or contact our support team
        </p>
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search for help..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs defaultValue="faq" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="faq">FAQ</TabsTrigger>
          <TabsTrigger value="guides">Guides</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="faq">
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
              <CardDescription>Quick answers to the most common questions</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqItems.map((item, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger>{item.question}</AccordionTrigger>
                    <AccordionContent>{item.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guides">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {supportCategories.map((category, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {category.icon}
                    {category.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {category.articles.map((article, articleIndex) => (
                      <div
                        key={articleIndex}
                        className="flex items-center justify-between p-2 hover:bg-gray-50 rounded"
                      >
                        <span className="text-sm">{article}</span>
                        <ExternalLink className="h-4 w-4 text-gray-400" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="contact">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-emerald-600" />
                  Email Support
                </CardTitle>
                <CardDescription>support@maatk12.edu</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Mail className="h-5 w-5 text-emerald-600" />
                  <div>
                    <div className="font-medium">Email Support</div>
                    <div className="text-sm text-gray-600">support@maatk12.edu</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Phone className="h-5 w-5 text-emerald-600" />
                  <div>
                    <div className="font-medium">Phone Support</div>
                    <div className="text-sm text-gray-600">(555) 123-4567</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <MessageCircle className="h-5 w-5 text-emerald-600" />
                  <div>
                    <div className="font-medium">Live Chat</div>
                    <div className="text-sm text-gray-600">Available 8 AM - 6 PM</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Submit a Ticket</CardTitle>
                <CardDescription>Describe your issue and we'll help you resolve it</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Subject</label>
                  <Input
                    placeholder="Brief description of your issue"
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={ticketCategory}
                    onChange={(e) => setTicketCategory(e.target.value)}
                  >
                    <option>Technical Issue</option>
                    <option>Account Problem</option>
                    <option>Assignment Help</option>
                    <option>General Question</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <textarea
                    className="w-full p-2 border rounded-md h-24"
                    placeholder="Please describe your issue in detail..."
                    value={ticketDescription}
                    onChange={(e) => setTicketDescription(e.target.value)}
                  ></textarea>
                </div>
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={handleSubmitTicket}>
                  Submit Ticket
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="resources">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  Video Tutorials
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 border rounded-lg">
                    <div className="font-medium text-sm">Platform Overview</div>
                    <div className="text-xs text-gray-600">5:30 minutes</div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="font-medium text-sm">Submitting Assignments</div>
                    <div className="text-xs text-gray-600">3:15 minutes</div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="font-medium text-sm">Using Discussions</div>
                    <div className="text-xs text-gray-600">4:45 minutes</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  User Guides
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 border rounded-lg">
                    <div className="font-medium text-sm">Student Handbook</div>
                    <Badge variant="outline" className="text-xs">
                      PDF
                    </Badge>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="font-medium text-sm">Quick Start Guide</div>
                    <Badge variant="outline" className="text-xs">
                      PDF
                    </Badge>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="font-medium text-sm">Feature Overview</div>
                    <Badge variant="outline" className="text-xs">
                      PDF
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Community
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 border rounded-lg">
                    <div className="font-medium text-sm">Student Forum</div>
                    <div className="text-xs text-gray-600">Ask questions & share tips</div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="font-medium text-sm">Study Groups</div>
                    <div className="text-xs text-gray-600">Connect with classmates</div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="font-medium text-sm">Announcements</div>
                    <div className="text-xs text-gray-600">Latest platform updates</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
