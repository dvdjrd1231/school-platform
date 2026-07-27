import { StaffDirectory } from "@/components/campus/staff-directory"

/** Advising — the school office and administrators. */
export default function AdvisingSupportPage() {
  return (
    <StaffDirectory
      title="Advising"
      description="Administrators and the school office. Message them about placements, records or anything a teacher can't answer."
      role="admin"
      emptyMessage="No administrators are listed yet."
    />
  )
}
