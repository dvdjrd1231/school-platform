"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

import { useApi } from "@/hooks/use-api"
import { useRole } from "@/components/context/role-context"

export interface CourseSummary {
  _id: string
  code: string
  title: string
  subject: string
  status: string
  schedule?: string
  room?: string
  instructor?: { _id?: string; name?: string } | null
  enrolledCount?: number
  maxStudents?: number
}

interface CourseContextValue {
  courses: CourseSummary[]
  isLoading: boolean
  error: string | null
  /** The course the classroom views are currently pointed at, or null. */
  selectedId: string | null
  selected: CourseSummary | null
  /** Pass null to clear the selection, e.g. when the last course is deleted. */
  select: (id: string | null) => void
  refetch: () => Promise<void>
}

const CourseContext = createContext<CourseContextValue | undefined>(undefined)

const STORAGE_KEY = "school-platform:selected-course"

/**
 * One list of the signed-in user's courses, shared by everything that needs
 * "which class am I looking at?" — the sidebar picker, the Content tab, the
 * classroom tabs.
 *
 * This is what fixes the dropdown that never showed a newly created course: it
 * was hard-coded sample data, and each screen had its own copy. Now there is a
 * single live list, and the choice survives navigation via localStorage.
 */
export function CourseProvider({ children }: { children: ReactNode }) {
  // Signed-out visitors (the auth pages) have no courses to fetch — asking would
  // just 401 on every render of the sign-in screen.
  const { userId } = useRole()
  const { data, error, isLoading, refetch } = useApi<{ courses: CourseSummary[] }>(
    userId ? "/api/courses" : null,
  )
  const courses = useMemo(() => data?.courses ?? [], [data])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Restore the previous choice once, on mount.
  useEffect(() => {
    if (typeof window === "undefined") return
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored) setSelectedId(stored)
  }, [])

  const select = useCallback((id: string | null) => {
    setSelectedId(id)
    if (typeof window === "undefined") return
    if (id) window.localStorage.setItem(STORAGE_KEY, id)
    else window.localStorage.removeItem(STORAGE_KEY)
  }, [])

  /**
   * Keep the selection pointing at a course that exists.
   *
   * Two cases, and the second used to be missed: when other courses remain we
   * fall back to the first, but when the *last* course is deleted the stored id
   * has to be cleared too. Leaving it meant every screen kept requesting a
   * course that no longer existed, on this and every future visit, because the
   * dead id stayed in localStorage.
   */
  useEffect(() => {
    if (isLoading) return
    if (!selectedId) return

    const stillExists = courses.some((c) => c._id === selectedId)
    if (stillExists) return

    select(courses.length > 0 ? courses[0]._id : null)
  }, [courses, selectedId, isLoading, select])

  // Pick a first course when nothing is chosen yet.
  useEffect(() => {
    if (isLoading || selectedId || courses.length === 0) return
    select(courses[0]._id)
  }, [courses, selectedId, isLoading, select])

  const value = useMemo<CourseContextValue>(
    () => ({
      courses,
      isLoading,
      error,
      selectedId,
      selected: courses.find((c) => c._id === selectedId) ?? null,
      select,
      refetch,
    }),
    [courses, isLoading, error, selectedId, select, refetch],
  )

  return <CourseContext.Provider value={value}>{children}</CourseContext.Provider>
}

export function useCourses(): CourseContextValue {
  const context = useContext(CourseContext)
  if (context === undefined) {
    throw new Error("useCourses must be used within a CourseProvider")
  }
  return context
}
