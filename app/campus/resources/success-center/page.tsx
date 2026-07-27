import { StaffDirectory } from "@/components/campus/staff-directory"

/** Success centre — the teachers available for extra help. */
export default function SuccessCenterPage() {
  return (
    <StaffDirectory
      title="Success centre"
      description="Your teachers and their office hours. Ask for extra help with anything you're stuck on."
      role="teacher"
    />
  )
}
