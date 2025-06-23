"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import type { User, UserStats } from "@/types"

export function useUserProfile() {
  const { data: session, update } = useSession()
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch user profile
  const fetchProfile = useCallback(async () => {
    if (!session?.user?.id) return

    try {
      setLoading(true)
      const response = await fetch("/api/user/profile")
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      } else {
        throw new Error("Failed to fetch profile")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch profile")
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id])

  // Fetch user stats
  const fetchStats = useCallback(async () => {
    if (!session?.user?.id) return

    try {
      const response = await fetch("/api/user/stats")
      if (response.ok) {
        const statsData = await response.json()
        setStats(statsData)
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err)
    }
  }, [session?.user?.id])

  // Update profile
  const updateProfile = useCallback(
    async (updates: Partial<User>) => {
      if (!session?.user?.id) return false

      setSaving(true)
      try {
        const response = await fetch("/api/user/profile", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updates),
        })

        if (response.ok) {
          // Update local state
          setUser((prev) => (prev ? { ...prev, ...updates } : null))

          // Update session if name or image changed
          if (updates.name || updates.avatar) {
            await update({
              ...session,
              user: {
                ...session.user,
                name: updates.name || session.user.name,
                image: updates.avatar || session.user.image,
              },
            })
          }

          // Refresh stats
          await fetchStats()
          return true
        } else {
          throw new Error("Failed to update profile")
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update profile")
        return false
      } finally {
        setSaving(false)
      }
    },
    [session, update, fetchStats],
  )

  // Update preferences
  const updatePreferences = useCallback(
    async (preferences: Partial<User["preferences"]>) => {
      if (!session?.user?.id) return false

      try {
        const response = await fetch("/api/user/preferences", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(preferences),
        })

        if (response.ok) {
          // Update local state
          setUser((prev) =>
            prev
              ? {
                  ...prev,
                  preferences: { ...prev.preferences, ...preferences },
                }
              : null,
          )
          return true
        } else {
          throw new Error("Failed to update preferences")
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update preferences")
        return false
      }
    },
    [session?.user?.id],
  )

  // Track activity
  const trackActivity = useCallback(async () => {
    if (!session?.user?.id) return

    try {
      await fetch("/api/user/activity", {
        method: "POST",
      })
    } catch (err) {
      console.error("Failed to track activity:", err)
    }
  }, [session?.user?.id])

  // Auto-track activity on page load and focus
  useEffect(() => {
    if (session?.user?.id) {
      trackActivity()

      const handleFocus = () => trackActivity()
      const handleVisibilityChange = () => {
        if (!document.hidden) trackActivity()
      }

      window.addEventListener("focus", handleFocus)
      document.addEventListener("visibilitychange", handleVisibilityChange)

      // Track activity every 5 minutes
      const interval = setInterval(trackActivity, 5 * 60 * 1000)

      return () => {
        window.removeEventListener("focus", handleFocus)
        document.removeEventListener("visibilitychange", handleVisibilityChange)
        clearInterval(interval)
      }
    }
  }, [session?.user?.id, trackActivity])

  // Initial data fetch
  useEffect(() => {
    if (session?.user?.id) {
      fetchProfile()
      fetchStats()
    }
  }, [session?.user?.id, fetchProfile, fetchStats])

  return {
    user,
    stats,
    loading,
    saving,
    error,
    updateProfile,
    updatePreferences,
    fetchProfile,
    fetchStats,
    trackActivity,
  }
}
