"use client"

import { useState, useCallback, useEffect } from "react"
import type { Chat } from "@/types"

interface UseChatManagerOptions {
  userId: string
}

export function useChatManager({ userId }: UseChatManagerOptions) {
  const [chats, setChats] = useState<Chat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch all user chats
  const fetchChats = useCallback(async () => {
    if (!userId) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/chats")
      if (!response.ok) {
        throw new Error("Failed to fetch chats")
      }

      const data = await response.json()
      setChats(data)
    } catch (err) {
      console.error("Error fetching chats:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch chats")
    } finally {
      setLoading(false)
    }
  }, [userId])

  // Create a new chat
  const createChat = useCallback(
    async (title?: string): Promise<Chat | null> => {
      if (!userId) return null

      try {
        const response = await fetch("/api/chats", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ title: title || "New Chat" }),
        })

        if (!response.ok) {
          throw new Error("Failed to create chat")
        }

        const newChat = await response.json()
        setChats((prev) => [newChat, ...prev])
        return newChat
      } catch (err) {
        console.error("Error creating chat:", err)
        setError(err instanceof Error ? err.message : "Failed to create chat")
        return null
      }
    },
    [userId],
  )

  // Update chat title
  const updateChatTitle = useCallback(async (chatId: string, title: string) => {
    try {
      const response = await fetch(`/api/chats/${chatId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title }),
      })

      if (!response.ok) {
        throw new Error("Failed to update chat title")
      }

      // Update local state
      setChats((prev) => prev.map((chat) => (chat.id === chatId ? { ...chat, title, updatedAt: new Date() } : chat)))
    } catch (err) {
      console.error("Error updating chat title:", err)
    }
  }, [])

  // Delete a chat
  const deleteChat = useCallback(async (chatId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/chats/${chatId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete chat")
      }

      // Update local state
      setChats((prev) => prev.filter((chat) => chat.id !== chatId))
      return true
    } catch (err) {
      console.error("Error deleting chat:", err)
      setError(err instanceof Error ? err.message : "Failed to delete chat")
      return false
    }
  }, [])

  // Update chat in local state (for real-time updates)
  const updateChat = useCallback((updatedChat: Chat) => {
    setChats((prev) => prev.map((chat) => (chat.id === updatedChat.id ? updatedChat : chat)))
  }, [])

  // Add new chat to local state
  const addChat = useCallback((newChat: Chat) => {
    setChats((prev) => {
      // Check if chat already exists
      const exists = prev.some((chat) => chat.id === newChat.id)
      if (exists) {
        return prev.map((chat) => (chat.id === newChat.id ? newChat : chat))
      }
      return [newChat, ...prev]
    })
  }, [])

  // Initial fetch when userId changes
  useEffect(() => {
    if (userId) {
      fetchChats()
    } else {
      setChats([])
      setLoading(false)
    }
  }, [userId, fetchChats])

  return {
    chats,
    loading,
    error,
    fetchChats,
    createChat,
    updateChatTitle,
    deleteChat,
    updateChat,
    addChat,
  }
}
