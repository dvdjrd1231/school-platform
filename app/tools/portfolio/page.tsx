import { FileLibrary } from "@/components/files/file-library"

export default function PortfolioPage() {
  return (
    <div className="container mx-auto p-6">
      <FileLibrary
        context="portfolio"
        title="E-Portfolio"
        description="Your best work, collected. Add items and choose whether to keep them private or share them with your class."
      />
    </div>
  )
}
