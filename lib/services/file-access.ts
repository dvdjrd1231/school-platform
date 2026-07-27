import type { IFileAsset } from "@/lib/models/FileAsset"
import { hasRole, type SessionUser } from "@/lib/api/helpers"
import { courseScope } from "@/lib/api/scope"

/**
 * May this person read this file?
 *
 * Shared by the download, metadata and delete routes so a file can't be
 * reachable through one of them and not the others.
 */
export async function canReadFile(me: SessionUser, file: IFileAsset): Promise<boolean> {
  if (hasRole(me, "admin")) return true
  if (String(file.owner) === me.id) return true
  if (file.visibility === "school") return true

  // A report card is readable by the student it's about and their guardians,
  // which the course rule below wouldn't cover.
  if (file.student && String(file.student) === me.id) return true

  if (file.visibility === "course" && file.course) {
    const scope = await courseScope(me)
    if (scope.unrestricted || scope.ids.includes(String(file.course))) return true
  }

  return false
}

/** Only the owner or an admin may change or remove a file. */
export function canWriteFile(me: SessionUser, file: IFileAsset): boolean {
  return String(file.owner) === me.id || hasRole(me, "admin")
}
