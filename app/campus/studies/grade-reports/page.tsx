import { GradeBook } from "@/components/grades/grade-book"

/** The campus-side grade report — the same live gradebook as /grades. */
export default function GradeReportsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <GradeBook />
    </div>
  )
}
