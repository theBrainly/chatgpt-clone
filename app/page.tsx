"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { ChatInterface } from "@/components/chat/ChatInterface"
import { Sidebar } from "@/components/sidebar/Sidebar"
import { TopHeader } from "@/components/layout/TopHeader"
import { Button } from "@/components/ui/button"
import { Menu, X, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Chat } from "@/types"
import { AuthForm } from "@/components/auth/AuthForm"

export default function HomePage() {
  const { data: session, status } = useSession()
  const [currentChatId, setCurrentChatId] = useState<string | undefined>()
  const [currentChatTitle, setCurrentChatTitle] = useState<string>("ChatGPT")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Reset state when user changes (login/logout)
  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      // User is logged in, keep current state
    } else if (status === "unauthenticated") {
      // User logged out, reset state
      setCurrentChatId(undefined)
      setCurrentChatTitle("ChatGPT")
    }
  }, [session?.user?.id, status])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth >= 768) {
        setSidebarOpen(false)
      }
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const handleChatSelect = useCallback(
    (chatId: string) => {
      setCurrentChatId(chatId)
      if (isMobile) {
        setSidebarOpen(false)
      }
    },
    [isMobile],
  )

  const handleNewChat = useCallback(() => {
    setCurrentChatId(undefined)
    setCurrentChatTitle("ChatGPT")
    if (isMobile) {
      setSidebarOpen(false)
    }
  }, [isMobile])

  const handleTitleChange = useCallback((title: string) => {
    setCurrentChatTitle(title)
  }, [])

  const handleChatUpdate = useCallback(
    (chat: Chat) => {
      setCurrentChatTitle(chat.title)
      // If this is a new chat being created, update the current chat ID
      if (!currentChatId && chat.id) {
        setCurrentChatId(chat.id)
      }
    },
    [currentChatId],
  )

  // Show loading while checking authentication
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-[#212121]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  // Show auth form if not authenticated
  if (!session?.user?.id) {
    return <AuthForm mode="signin" />
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-[#212121]">
      {/* Mobile Menu Button */}
      {isMobile && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="fixed top-4 left-4 z-50 md:hidden bg-white dark:bg-[#2f2f2f] shadow-lg"
        >
          {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </Button>
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "transition-all duration-300 ease-in-out border-r border-gray-200 dark:border-gray-700",
          isMobile
            ? cn("fixed inset-y-0 left-0 z-40 w-80 transform", sidebarOpen ? "translate-x-0" : "-translate-x-full")
            : "w-80 flex-shrink-0",
        )}
      >
        <Sidebar
          currentChatId={currentChatId}
          onChatSelect={handleChatSelect}
          onNewChat={handleNewChat}
          onChatUpdate={handleChatUpdate}
        />
      </div>

      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <TopHeader title={currentChatTitle} />

        {/* Chat Interface */}
        <div className="flex-1 overflow-hidden">
          <ChatInterface
            chatId={currentChatId}
            userId={session.user.id}
            onTitleChange={handleTitleChange}
            onChatUpdate={handleChatUpdate}
          />
        </div>
      </div>
    </div>
  )
}
