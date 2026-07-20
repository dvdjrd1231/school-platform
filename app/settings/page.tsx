import type { Metadata } from "next"
import { SettingsContent } from "@/components/settings/settings-content"

export const metadata: Metadata = {
  title: "Settings - Maat K12",
  description: "Manage your account settings and preferences",
}

export default function SettingsPage() {
  return <SettingsContent />
}
