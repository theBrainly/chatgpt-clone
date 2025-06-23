"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import type { Message, Attachment, Chat } from "@/types"
import { nanoid } from "nanoid"

interface UseChatOptions {
  chatId?: string
  userId: string
  onTitleUpdate?: (title: string) => void
  onChatUpdate?: (chat: Chat) => void
  isSharedMode?: boolean
  sharedChat?: Chat
}

export function useChat({
  chatId,
  userId,
  onTitleUpdate,
  onChatUpdate,
  isSharedMode = false,
  sharedChat,
}: UseChatOptions) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [chatTitle, setChatTitle] = useState<string>("New Chat")
  const [loadingChat, setLoadingChat] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Helper function to ensure timestamps are Date objects
  const normalizeMessage = (message: any): Message => {
    return {
      ...message,
      timestamp: message.timestamp instanceof Date ? message.timestamp : new Date(message.timestamp || Date.now()),
      attachments: message.attachments || [],
    }
  }

  // Load chat when chatId changes
  useEffect(() => {
    if (isSharedMode && sharedChat) {
      // For shared mode, use the provided chat data
      const normalizedMessages = (sharedChat.messages || []).map(normalizeMessage)
      setMessages(normalizedMessages)
      setChatTitle(sharedChat.title)
      setLoadingChat(false)
    } else if (chatId && !isSharedMode) {
      loadChat(chatId)
    } else {
      // Reset for new chat
      setMessages([])
      setChatTitle("New Chat")
    }
  }, [chatId, isSharedMode, sharedChat])

  const loadChat = async (id: string) => {
    setLoadingChat(true)
    try {
      const response = await fetch(`/api/chats/${id}`)
      if (response.ok) {
        const chat: Chat = await response.json()
        // Normalize all messages to ensure timestamps are Date objects
        const normalizedMessages = (chat.messages || []).map(normalizeMessage)
        setMessages(normalizedMessages)
        setChatTitle(chat.title)
        onChatUpdate?.(chat)
      } else {
        console.error("Failed to load chat")
        setMessages([])
        setChatTitle("New Chat")
      }
    } catch (error) {
      console.error("Error loading chat:", error)
      setMessages([])
      setChatTitle("New Chat")
    } finally {
      setLoadingChat(false)
    }
  }

  const generateChatTitle = useCallback((firstMessage: string): string => {
    // Generate a meaningful title from the first message
    const cleanMessage = firstMessage.trim()
    if (cleanMessage.length <= 50) {
      return cleanMessage
    }

    // Try to find a natural break point
    const sentences = cleanMessage.split(/[.!?]+/)
    if (sentences[0] && sentences[0].length <= 50) {
      return sentences[0].trim()
    }

    // Fallback to word boundary
    const words = cleanMessage.split(" ")
    let title = ""
    for (const word of words) {
      if ((title + " " + word).length > 47) break
      title += (title ? " " : "") + word
    }

    return title + "..."
  }, [])

  const updateChatTitle = useCallback(
    async (newTitle: string) => {
      if (!chatId || newTitle === chatTitle || isSharedMode) return

      setChatTitle(newTitle)
      onTitleUpdate?.(newTitle)

      try {
        await fetch(`/api/chats/${chatId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ title: newTitle }),
        })
      } catch (error) {
        console.error("Error updating chat title:", error)
      }
    },
    [chatId, chatTitle, onTitleUpdate, isSharedMode],
  )

  const sendMessage = useCallback(
    async (content: string, attachments: Attachment[] = [], model?: string) => {
      if (!content.trim() && attachments.length === 0) return

      let currentChatId = chatId

      // For shared mode, we don't create new chats
      if (isSharedMode && !currentChatId) {
        console.error("Cannot send message in shared mode without chatId")
        return
      }

      // If no chatId exists and not in shared mode, create a new chat first
      if (!currentChatId && !isSharedMode) {
        try {
          const response = await fetch("/api/chats", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ title: "New Chat" }),
          })

          if (response.ok) {
            const newChat = await response.json()
            currentChatId = newChat.id
            // Notify parent component about new chat
            if (onChatUpdate) {
              onChatUpdate(newChat)
            }
          } else {
            console.error("Failed to create new chat")
            return
          }
        } catch (error) {
          console.error("Error creating new chat:", error)
          return
        }
      }

      const userMessage: Message = {
        id: nanoid(),
        role: "user",
        content,
        timestamp: new Date(),
        attachments,
      }

      const assistantMessage: Message = {
        id: nanoid(),
        role: "assistant",
        content: "",
        timestamp: new Date(),
        isStreaming: true,
      }

      const newMessages = [...messages, userMessage, assistantMessage]
      setMessages(newMessages)
      setIsLoading(true)

      // Generate title from first user message if this is a new chat and not shared mode
      if (messages.length === 0 && content.trim() && !isSharedMode) {
        const newTitle = generateChatTitle(content)
        updateChatTitle(newTitle)
      }

      // Create abort controller for this request
      abortControllerRef.current = new AbortController()

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: [...messages, userMessage],
            chatId: currentChatId,
            userId,
            model, // Add model to request
          }),
          signal: abortControllerRef.current.signal,
        })

        if (!response.ok) {
          // Try to get error details from the response body
          let errorText = "Failed to send message"
          try {
            errorText = await response.text()
          } catch (e) {
            // ignore
          }
          // Log error details to the console for debugging
          console.error("Chat API error:", errorText, response.status)
          // Optionally, set an error state to display in the UI
          setError(errorText)
          setIsLoading(false)
          return
        }

        const reader = response.body?.getReader()
        if (!reader) {
          const errorMsg = "No response body"
          console.error(errorMsg)
          setError(errorMsg)
          setIsLoading(false)
          return
        }

        let accumulatedContent = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = new TextDecoder().decode(value)
          const lines = chunk.split("\n")

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6)
              if (data === "[DONE]") continue

              try {
                const parsed = JSON.parse(data)
                if (parsed.choices?.[0]?.delta?.content) {
                  accumulatedContent += parsed.choices[0].delta.content

                  setMessages((prev) =>
                    prev.map((msg) => (msg.id === assistantMessage.id ? { ...msg, content: accumulatedContent } : msg)),
                  )
                }
              } catch (e) {
                // Ignore parsing errors for streaming data
              }
            }
          }
        }

        // Mark streaming as complete and update chat
        const finalMessages = newMessages.map((msg) =>
          msg.id === assistantMessage.id ? { ...msg, content: accumulatedContent, isStreaming: false } : msg,
        )

        setMessages(finalMessages)

        // Update chat in database with final messages (not for shared mode)
        if (currentChatId && !isSharedMode) {
          await fetch(`/api/chats/${currentChatId}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ messages: finalMessages }),
          })
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          // Request was aborted
          setMessages((prev) => prev.filter((msg) => msg.id !== assistantMessage.id))
        } else {
          console.error("Error sending message:", error)
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessage.id
                ? { ...msg, content: "Sorry, I encountered an error. Please try again.", isStreaming: false }
                : msg,
            ),
          )
        }
      } finally {
        setIsLoading(false)
        abortControllerRef.current = null
      }
    },
    [messages, chatId, userId, generateChatTitle, updateChatTitle, onChatUpdate, isSharedMode],
  )

  const editMessage = useCallback(
    (messageId: string, newContent: string) => {
      // Don't allow editing in shared mode
      if (isSharedMode) return

      const updatedMessages = messages.map((msg) =>
        msg.id === messageId ? { ...msg, content: newContent, isEditing: false } : msg,
      )

      setMessages(updatedMessages)
      setEditingMessageId(null)

      // Find the message index and regenerate from that point
      const messageIndex = messages.findIndex((msg) => msg.id === messageId)
      if (messageIndex !== -1) {
        const messagesUpToEdit = updatedMessages.slice(0, messageIndex + 1)

        // Remove messages after the edited one and regenerate
        setMessages(messagesUpToEdit)

        // Trigger regeneration if it was a user message
        if (messages[messageIndex].role === "user") {
          // Update the messages state first, then send
          setTimeout(() => {
            sendMessage(newContent, messages[messageIndex].attachments)
          }, 100)
        }
      }

      // Update chat in database
      if (chatId) {
        fetch(`/api/chats/${chatId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ messages: updatedMessages }),
        }).catch(console.error)
      }
    },
    [messages, sendMessage, chatId, isSharedMode],
  )

  const deleteMessage = useCallback(
    (messageId: string) => {
      // Don't allow deleting in shared mode
      if (isSharedMode) return

      const updatedMessages = messages.filter((msg) => msg.id !== messageId)
      setMessages(updatedMessages)

      // Update chat in database
      if (chatId) {
        fetch(`/api/chats/${chatId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ messages: updatedMessages }),
        }).catch(console.error)
      }
    },
    [messages, chatId, isSharedMode],
  )

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }, [])

  const regenerateResponse = useCallback(() => {
    // Don't allow regeneration in shared mode
    if (isSharedMode) return

    const lastUserMessage = [...messages].reverse().find((msg) => msg.role === "user")
    if (lastUserMessage) {
      // Remove the last assistant message if it exists
      setMessages((prev) => {
        const lastAssistantIndex = prev.map((m) => m.role).lastIndexOf("assistant")
        if (lastAssistantIndex !== -1) {
          return prev.slice(0, lastAssistantIndex)
        }
        return prev
      })

      sendMessage(lastUserMessage.content, lastUserMessage.attachments)
    }
  }, [messages, sendMessage, isSharedMode])

  return {
    messages,
    isLoading: isLoading || loadingChat,
    loadingChat,
    chatTitle,
    sendMessage,
    editMessage,
    deleteMessage,
    stopGeneration,
    regenerateResponse,
    editingMessageId,
    setEditingMessageId,
  }
}
