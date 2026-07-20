export default function SeminarPage() {
  const mockSeminars = [
    {
      id: 1,
      title: "Advanced Mathematics Workshop",
      date: "2024-01-15",
      time: "10:00 AM",
      instructor: "Dr. Smith",
      enrolled: 24,
      capacity: 30,
      status: "upcoming",
    },
    {
      id: 2,
      title: "Science Fair Preparation",
      date: "2024-01-18",
      time: "2:00 PM",
      instructor: "Prof. Johnson",
      enrolled: 18,
      capacity: 25,
      status: "upcoming",
    },
    {
      id: 3,
      title: "Creative Writing Seminar",
      date: "2024-01-12",
      time: "1:00 PM",
      instructor: "Ms. Davis",
      enrolled: 15,
      capacity: 20,
      status: "completed",
    },
    {
      id: 4,
      title: "College Prep Session",
      date: "2024-01-20",
      time: "11:00 AM",
      instructor: "Mr. Wilson",
      enrolled: 32,
      capacity: 35,
      status: "upcoming",
    },
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Seminars & Workshops</h1>
          <p className="text-gray-600">Register and manage your seminar attendance</p>
        </div>

        <div className="mb-6 flex gap-4">
          <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
            Register for Seminar
          </button>
          <button className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            View Calendar
          </button>
        </div>

        <div className="grid gap-4">
          {mockSeminars.map((seminar) => (
            <div key={seminar.id} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">{seminar.title}</h3>
                  <p className="text-gray-600">Instructor: {seminar.instructor}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    seminar.status === "upcoming" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {seminar.status}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium">{seminar.date}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Time</p>
                  <p className="font-medium">{seminar.time}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Enrolled</p>
                  <p className="font-medium">
                    {seminar.enrolled}/{seminar.capacity}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-emerald-600 h-2 rounded-full"
                      style={{ width: `${(seminar.enrolled / seminar.capacity) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                {seminar.status === "upcoming" ? (
                  <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                    Register
                  </button>
                ) : (
                  <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                    View Materials
                  </button>
                )}
                <button className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
