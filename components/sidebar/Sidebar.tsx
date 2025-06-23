"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Plus, Search, MessageSquare, Trash2, Library, Sparkles, Bot, Crown, ChevronRight } from "lucide-react"
import type { Chat } from "@/types"
import { cn } from "@/lib/utils"
import { UserMenu } from "./UserMenu"
import { useSession } from "next-auth/react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useChatManager } from "@/hooks/useChatManager"

interface SidebarProps {
  currentChatId?: string
  onChatSelect: (chatId: string) => void
  onNewChat: () => void
  onChatUpdate?: (chat: Chat) => void
  className?: string
}

export function Sidebar({ currentChatId, onChatSelect, onNewChat, onChatUpdate, className }: SidebarProps) {
  const { data: session } = useSession()
  const [searchQuery, setSearchQuery] = useState("")
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null)

  const userId = session?.user?.id || ""

  const { chats, loading, error, createChat, deleteChat, updateChatTitle, fetchChats } = useChatManager({ userId })

  useEffect(() => {
    if (userId) {
      fetchChats()
    }
  }, [userId, fetchChats])

  const handleNewChat = async () => {
    if (!userId) return
    onNewChat()
  }

  const handleChatSelect = (chatId: string) => {
    onChatSelect(chatId)
  }

  const handleDeleteChat = async (chatId: string) => {
    setDeletingChatId(chatId)
    const success = await deleteChat(chatId)
    if (success && currentChatId === chatId) {
      onNewChat()
    }
    setDeletingChatId(null)
  }

  const filteredChats = chats.filter((chat) => chat.title.toLowerCase().includes(searchQuery.toLowerCase()))

  const formatDate = (date: Date | string) => {
    const now = new Date()
    const chatDate = new Date(date)
    const diffTime = Math.abs(now.getTime() - chatDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return "Today"
    if (diffDays === 2) return "Yesterday"
    if (diffDays <= 7) return `${diffDays} days ago`
    return chatDate.toLocaleDateString()
  }

  return (
    <div className={cn("flex flex-col h-full bg-gray-50 dark:bg-[#171717] overflow-hidden", className)}>
      {/* Header with Logo */}
      <div className="flex-shrink-0 p-3">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-black dark:bg-white rounded-full flex items-center justify-center">
            <div className="w-4 h-4 bg-white dark:bg-black rounded-full" />
          </div>
        </div>

        {/* New Chat Button */}
        <Button
          onClick={handleNewChat}
          className="w-full justify-start gap-2 bg-white dark:bg-[#2f2f2f] text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-[#3f3f3f]"
          variant="outline"
        >
          <Plus className="w-4 h-4" />
          New chat
        </Button>
      </div>

      {/* Search */}
      <div className="flex-shrink-0 px-3 mb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search chats"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white dark:bg-[#2f2f2f] border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Navigation Items */}
      <div className="flex-shrink-0 px-3 mb-4 space-y-1">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2f2f2f]"
        >
          <Library className="w-4 h-4" />
          Library
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2f2f2f]"
        >
          <Sparkles className="w-4 h-4" />
          Sora
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2f2f2f]"
        >
          <Bot className="w-4 h-4" />
          GPTs
        </Button>
      </div>

      {/* Chats Section */}
      <div className="flex-shrink-0 px-3 mb-2">
        <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Chats</h3>
      </div>

      {/* Chat List - Scrollable */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full px-3">
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-200 dark:bg-[#2f2f2f] rounded animate-pulse" />
              ))}
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{searchQuery ? "No chats found" : "No chats yet"}</p>
            </div>
          ) : (
            <div className="space-y-1 pb-4">
              {filteredChats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => handleChatSelect(chat.id)}
                  className={cn(
                    "group flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors relative",
                    currentChatId === chat.id
                      ? "bg-gray-200 dark:bg-[#2f2f2f]"
                      : "hover:bg-gray-100 dark:hover:bg-[#2f2f2f]",
                  )}
                >
                  <MessageSquare className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />

                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-900 dark:text-white truncate">{chat.title}</div>
                  </div>

                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => e.stopPropagation()}
                          className="h-6 w-6 p-0 hover:bg-red-100 dark:hover:bg-red-900 hover:text-red-600"
                          disabled={deletingChatId === chat.id}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete chat?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete "{chat.title}" and all its messages. This action cannot be
                            undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteChat(chat.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Footer - Fixed at bottom */}
      <div className="flex-shrink-0 p-3 border-t border-gray-200 dark:border-gray-700">
        {/* Upgrade Plan */}
        <div className="mb-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-medium text-purple-900 dark:text-purple-100">Upgrade plan</span>
          </div>
          <p className="text-xs text-purple-700 dark:text-purple-300 mb-2">More access to the best models</p>
          <Button size="sm" className="w-full bg-purple-600 hover:bg-purple-700 text-white">
            <ChevronRight className="w-3 h-3 ml-auto" />
          </Button>
        </div>

        <UserMenu />
      </div>
    </div>
  )
}
