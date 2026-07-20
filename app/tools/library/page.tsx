export default function LibraryPage() {
  const mockResources = [
    { id: 1, title: "Mathematics Textbook", type: "PDF", size: "15.2 MB", downloads: 234, category: "Textbooks" },
    { id: 2, title: "Science Lab Manual", type: "PDF", size: "8.7 MB", downloads: 156, category: "Lab Manuals" },
    { id: 3, title: "History Timeline", type: "Interactive", size: "2.1 MB", downloads: 89, category: "Interactive" },
    {
      id: 4,
      title: "English Literature Guide",
      type: "PDF",
      size: "12.4 MB",
      downloads: 198,
      category: "Study Guides",
    },
    { id: 5, title: "Chemistry Reference", type: "PDF", size: "6.8 MB", downloads: 145, category: "Reference" },
  ]

  const categories = ["All", "Textbooks", "Lab Manuals", "Interactive", "Study Guides", "Reference"]

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Digital Library</h1>
          <p className="text-gray-600">Access educational resources and materials</p>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              className="px-4 py-2 rounded-lg border border-gray-200 hover:bg-emerald-50 hover:border-emerald-200 transition-colors"
            >
              {category}
            </button>
          ))}
        </div>

        <div className="grid gap-4">
          {mockResources.map((resource) => (
            <div
              key={resource.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{resource.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded">{resource.type}</span>
                    <span>{resource.size}</span>
                    <span>{resource.downloads} downloads</span>
                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">{resource.category}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                    Download
                  </button>
                  <button className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    Preview
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
