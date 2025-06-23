"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Sidebar } from "@/components/sidebar/Sidebar"
import { ChatInterface } from "@/components/chat/ChatInterface"
import { TopHeader } from "@/components/layout/TopHeader"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Chat } from "@/types"

interface AppLayoutProps {
  children?: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const { data: session } = useSession()
  const [currentChatId, setCurrentChatId] = useState<string | undefined>()
  const [currentChatTitle, setCurrentChatTitle] = useState<string>("ChatGPT")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

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

  const handleChatSelect = (chatId: string) => {
    setCurrentChatId(chatId)
    if (isMobile) {
      setSidebarOpen(false)
    }
  }

  const handleNewChat = () => {
    setCurrentChatId(undefined)
    setCurrentChatTitle("ChatGPT")
    if (isMobile) {
      setSidebarOpen(false)
    }
  }

  const handleTitleChange = (title: string) => {
    setCurrentChatTitle(title)
  }

  const handleChatUpdate = (chat: Chat) => {
    setCurrentChatTitle(chat.title)
    if (!currentChatId && chat.id) {
      setCurrentChatId(chat.id)
    }
  }

  if (!session?.user?.id) {
    return children
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-[#212121] transition-colors">
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
          "transition-all duration-300 ease-in-out border-r border-gray-200 dark:border-gray-700 flex-shrink-0",
          isMobile
            ? cn("fixed inset-y-0 left-0 z-40 w-80 transform", sidebarOpen ? "translate-x-0" : "-translate-x-full")
            : "w-80",
        )}
      >
        <Sidebar
          currentChatId={currentChatId}
          onChatSelect={handleChatSelect}
          onNewChat={handleNewChat}
          onChatUpdate={handleChatUpdate}
          className="h-full"
        />
      </div>

      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <TopHeader title={currentChatTitle} />
        <div className="flex-1 overflow-hidden">
          {children || (
            <ChatInterface
              chatId={currentChatId}
              userId={session.user.id}
              onTitleChange={handleTitleChange}
              onChatUpdate={handleChatUpdate}
            />
          )}
        </div>
      </div>
    </div>
  )
}
