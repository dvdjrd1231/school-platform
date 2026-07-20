import { getUsers, getClasses, getAnnouncements } from "@/lib/database"

export default function TestDataPage() {
  const mockUsers = getUsers()
  const mockClasses = getClasses()
  const mockAnnouncements = getAnnouncements()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Test Data Viewer</h1>

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Mock Users</h2>
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Role</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {mockUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="px-4 py-3 text-sm text-gray-900">{user.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            user.role === "admin"
                              ? "bg-red-100 text-red-800"
                              : user.role === "teacher"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-green-100 text-green-800"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{user.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Mock Classes</h2>
            <div className="grid gap-4">
              {mockClasses.map((cls) => (
                <div key={cls.id} className="bg-white rounded-lg border border-gray-200 p-4">
                  <h3 className="font-semibold text-gray-900">{cls.name}</h3>
                  <p className="text-sm text-gray-600">Teacher: {cls.teacher}</p>
                  <p className="text-sm text-gray-600">
                    Students: {cls.students}/{cls.capacity}
                  </p>
                  <p className="text-sm text-gray-600">Schedule: {cls.schedule}</p>
                  <p className="text-sm text-gray-600">Room: {cls.room}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Mock Announcements</h2>
            <div className="space-y-3">
              {mockAnnouncements.map((announcement) => (
                <div key={announcement.id} className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{announcement.title}</h3>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        announcement.priority === "high" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {announcement.priority}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-2">{announcement.content}</p>
                  <p className="text-sm text-gray-500">{announcement.date}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
