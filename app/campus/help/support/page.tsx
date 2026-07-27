import { StaffDirectory } from "@/components/campus/staff-directory"

/**
 * Support — who to contact when you're stuck.
 *
 * The page previously listed invented support staff with invented phone
 * numbers; someone would eventually have tried to ring one. It now lists the
 * real staff this person can reach.
 */
export default function SupportPage() {
  return (
    <StaffDirectory
      title="Support"
      description="Staff you can contact for help. Messages go straight to them on the platform."
    />
  )
}
