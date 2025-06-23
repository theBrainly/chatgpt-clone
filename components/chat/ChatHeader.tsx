"use client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Bot, MoreHorizontal } from "lucide-react"
import { ActiveUsers } from "@/components/collaboration/ActiveUsers"
import { ShareChatDialog } from "@/components/collaboration/ShareChatDialog"
import { useCollaboration } from "@/hooks/useCollaboration"

interface ChatHeaderProps {
  title?: string
  chatId?: string
  isShared?: boolean
}

export function ChatHeader({ title = "ChatGPT", chatId, isShared = false }: ChatHeaderProps) {
  const { activeUsers } = useCollaboration({ chatId, enabled: !!chatId })

  return (
    <div className="flex items-center justify-between p-4 border-b bg-white">
      <div className="flex items-center gap-3">
        <Avatar className="w-8 h-8">
          <AvatarFallback className="bg-green-600 text-white">
            <Bot className="w-4 h-4" />
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="font-semibold text-gray-900 truncate max-w-md">{title}</h1>
          <div className="flex items-center gap-2">
            <p className="text-sm text-gray-500">Online</p>
            {isShared && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Shared</span>}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <ActiveUsers activeUsers={activeUsers} />

        {chatId && (
          <ShareChatDialog
            chatId={chatId}
            chatTitle={title}
            isShared={isShared}
            onShare={(shareLink) => {
              console.log("Chat shared:", shareLink)
            }}
          />
        )}

        <Button variant="ghost" size="sm">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
