"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSession } from "next-auth/react"
import type { ActiveUser, Collaborator } from "@/types"

interface UseCollaborationOptions {
  chatId?: string
  enabled?: boolean
}

export function useCollaboration({ chatId, enabled = true }: UseCollaborationOptions) {
  const { data: session } = useSession()
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([])
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const userId = session?.user?.id

  // Fetch collaborators
  const fetchCollaborators = useCallback(async () => {
    if (!chatId || !userId) return

    try {
      const response = await fetch(`/api/chats/${chatId}/collaborators`)
      if (response.ok) {
        const data = await response.json()
        setCollaborators(data)
      }
    } catch (error) {
      console.error("Error fetching collaborators:", error)
    }
  }, [chatId, userId])

  // Fetch active users
  const fetchActiveUsers = useCallback(async () => {
    if (!chatId || !userId) return

    try {
      const response = await fetch(`/api/chats/${chatId}/activity`)
      if (response.ok) {
        const data = await response.json()
        setActiveUsers(data.filter((user: ActiveUser) => user.userId !== userId))
      }
    } catch (error) {
      console.error("Error fetching active users:", error)
    }
  }, [chatId, userId])

  // Update activity
  const updateActivity = useCallback(
    async (activity: "join" | "leave" | "typing" | "stop_typing") => {
      if (!chatId || !userId) return

      try {
        await fetch(`/api/chats/${chatId}/activity`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ activity }),
        })
      } catch (error) {
        console.error("Error updating activity:", error)
      }
    },
    [chatId, userId],
  )

  // Join chat
  const joinChat = useCallback(() => {
    updateActivity("join")
  }, [updateActivity])

  // Leave chat
  const leaveChat = useCallback(() => {
    updateActivity("leave")
  }, [updateActivity])

  // Start typing
  const startTyping = useCallback(() => {
    if (isTyping) return

    setIsTyping(true)
    updateActivity("typing")

    // Auto-stop typing after 3 seconds of inactivity
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping()
    }, 3000)
  }, [isTyping, updateActivity])

  // Stop typing
  const stopTyping = useCallback(() => {
    if (!isTyping) return

    setIsTyping(false)
    updateActivity("stop_typing")

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }
  }, [isTyping, updateActivity])

  // Invite collaborator
  const inviteCollaborator = useCallback(
    async (email: string, role: "editor" | "viewer" = "viewer") => {
      if (!chatId) return false

      try {
        const response = await fetch(`/api/chats/${chatId}/collaborators`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, role }),
        })

        if (response.ok) {
          await fetchCollaborators()
          return true
        }
        return false
      } catch (error) {
        console.error("Error inviting collaborator:", error)
        return false
      }
    },
    [chatId, fetchCollaborators],
  )

  // Remove collaborator
  const removeCollaborator = useCallback(
    async (collaboratorId: string) => {
      if (!chatId) return false

      try {
        const response = await fetch(`/api/chats/${chatId}/collaborators`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ collaboratorId }),
        })

        if (response.ok) {
          await fetchCollaborators()
          return true
        }
        return false
      } catch (error) {
        console.error("Error removing collaborator:", error)
        return false
      }
    },
    [chatId, fetchCollaborators],
  )

  // Setup polling for active users
  useEffect(() => {
    if (!enabled || !chatId || !userId) return

    // Initial fetch
    fetchCollaborators()
    fetchActiveUsers()
    joinChat()

    // Poll for active users every 10 seconds
    intervalRef.current = setInterval(() => {
      fetchActiveUsers()
    }, 10000)

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      leaveChat()
    }
  }, [enabled, chatId, userId, fetchCollaborators, fetchActiveUsers, joinChat, leaveChat])

  // Cleanup typing timeout
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  return {
    activeUsers,
    collaborators,
    isTyping,
    startTyping,
    stopTyping,
    inviteCollaborator,
    removeCollaborator,
    fetchCollaborators,
  }
}
