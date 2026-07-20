import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { HelpCircle, MessageSquare, Phone, Mail, Clock, Search, BookOpen, Users, Settings } from "lucide-react"

export default function SupportPage() {
  const faqCategories = [
    {
      category: "Academic",
      icon: BookOpen,
      questions: [
        {
          q: "How do I register for classes?",
          a: "You can register through the student portal during your assigned registration time.",
        },
        {
          q: "What is the add/drop deadline?",
          a: "The add/drop deadline is typically two weeks after the semester begins.",
        },
        {
          q: "How do I request a transcript?",
          a: "Transcripts can be requested through the Registrar's office or online portal.",
        },
      ],
    },
    {
      category: "Technical",
      icon: Settings,
      questions: [
        {
          q: "I forgot my password. How do I reset it?",
          a: "Use the 'Forgot Password' link on the login page or contact IT support.",
        },
        {
          q: "Why can't I access my courses?",
          a: "Check your internet connection and try clearing your browser cache.",
        },
        {
          q: "How do I update my contact information?",
          a: "Log into your student portal and update your profile information.",
        },
      ],
    },
    {
      category: "Financial",
      icon: Users,
      questions: [
        { q: "When is tuition due?", a: "Tuition is typically due before the start of each semester." },
        {
          q: "How do I apply for financial aid?",
          a: "Complete the FAFSA form and submit required documentation to Financial Aid.",
        },
        { q: "Can I set up a payment plan?", a: "Yes, payment plans are available through the Business Office." },
      ],
    },
  ]

  const supportChannels = [
    {
      title: "Live Chat",
      description: "Get instant help from our support team",
      icon: MessageSquare,
      availability: "Mon-Fri 8AM-8PM",
      action: "Start Chat",
    },
    {
      title: "Phone Support",
      description: "Call us for immediate assistance",
      icon: Phone,
      availability: "Mon-Fri 8AM-6PM",
      action: "Call Now",
    },
    {
      title: "Email Support",
      description: "Send us a detailed message",
      icon: Mail,
      availability: "24/7 Response",
      action: "Send Email",
    },
  ]

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Support Center</h1>
        <p className="text-gray-600 mt-2">Get help with your questions and technical issues</p>
      </div>

      {/* Search Bar */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input placeholder="Search for help articles, FAQs, or topics..." className="pl-10" />
            </div>
            <Button className="bg-emerald-600 hover:bg-emerald-700">Search</Button>
          </div>
        </CardContent>
      </Card>

      {/* Support Channels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {supportChannels.map((channel, index) => (
          <Card key={index} className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <channel.icon className="h-12 w-12 text-emerald-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">{channel.title}</h3>
              <p className="text-sm text-gray-600 mb-2">{channel.description}</p>
              <div className="flex items-center justify-center gap-1 text-xs text-gray-500 mb-4">
                <Clock className="h-3 w-3" />
                {channel.availability}
              </div>
              <Button className="bg-emerald-600 hover:bg-emerald-700">{channel.action}</Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* FAQ Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {faqCategories.map((category, categoryIndex) => (
              <Card key={categoryIndex}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <category.icon className="h-5 w-5 text-emerald-600" />
                    {category.category}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {category.questions.map((faq, faqIndex) => (
                    <div key={faqIndex} className="border-b border-gray-100 last:border-b-0 pb-4 last:pb-0">
                      <h4 className="font-medium text-gray-900 mb-2">{faq.q}</h4>
                      <p className="text-sm text-gray-600">{faq.a}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Contact Form */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Submit a Support Request</h2>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-emerald-600" />
                Get Help
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" placeholder="Enter your full name" />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" placeholder="Enter your email" />
                </div>
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="academic">Academic Support</SelectItem>
                    <SelectItem value="technical">Technical Issues</SelectItem>
                    <SelectItem value="financial">Financial Questions</SelectItem>
                    <SelectItem value="account">Account Issues</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">Priority Level</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" placeholder="Brief description of your issue" />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Please provide detailed information about your issue..."
                  rows={6}
                />
              </div>

              <Button className="w-full bg-emerald-600 hover:bg-emerald-700">Submit Support Request</Button>
            </CardContent>
          </Card>

          {/* Recent Tickets */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Your Recent Tickets</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-sm">Password Reset Issue</p>
                  <p className="text-xs text-gray-500">Ticket #12345 • 2 days ago</p>
                </div>
                <Badge variant="secondary">Resolved</Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-sm">Course Access Problem</p>
                  <p className="text-xs text-gray-500">Ticket #12344 • 1 week ago</p>
                </div>
                <Badge>In Progress</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
