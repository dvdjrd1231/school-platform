import { redirect } from "next/navigation"

/**
 * The seminar schedule and the seminars page were two views of the same thing.
 * One list, one place to maintain it.
 */
export default function SeminarSchedulePage() {
  redirect("/tools/seminar")
}
