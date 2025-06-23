"use client"

import { useState } from "react"
import type { Message } from "@/types"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Edit2, Trash2, Check, X, Copy, User, ImageIcon, FileText } from "lucide-react"

interface ChatMessageProps {
  message: Message
  isEditing: boolean
  onEdit: (content: string) => void
  onDelete: () => void
  onStartEdit: () => void
  onCancelEdit: () => void
  canEdit?: boolean
  isSharedMode?: boolean
}

export function ChatMessage({
  message,
  isEditing,
  onEdit,
  onDelete,
  onStartEdit,
  onCancelEdit,
  canEdit = true,
  isSharedMode = false,
}: ChatMessageProps) {
  const [editContent, setEditContent] = useState(message.content)
  const [copied, setCopied] = useState(false)

  const handleSaveEdit = () => {
    onEdit(editContent)
  }

  const handleCancelEdit = () => {
    setEditContent(message.content)
    onCancelEdit()
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isUser = message.role === "user"
  const isAssistant = message.role === "assistant"

  const getTimestamp = () => {
    try {
      const timestamp = message.timestamp
      if (timestamp instanceof Date) {
        return timestamp
      }
      if (typeof timestamp === "string" || typeof timestamp === "number") {
        return new Date(timestamp)
      }
      return new Date()
    } catch (error) {
      console.error("Error parsing timestamp:", error)
      return new Date()
    }
  }

  const formatTime = (date: Date) => {
    try {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    } catch (error) {
      console.error("Error formatting time:", error)
      return "Invalid time"
    }
  }

  const messageDate = getTimestamp()

  return (
    <div className="group flex gap-4 py-6 px-4 hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors">
      <Avatar className="w-8 h-8 flex-shrink-0">
        {message.authorId ? (
          <AvatarFallback className="bg-purple-600 text-white text-sm font-medium">
            {message.authorName?.charAt(0).toUpperCase() || "U"}
          </AvatarFallback>
        ) : isUser ? (
          <AvatarFallback className="bg-purple-600 text-white text-sm font-medium">
            <User className="w-4 h-4" />
          </AvatarFallback>
        ) : (
          <div className="w-8 h-8 bg-black dark:bg-white rounded-full flex items-center justify-center">
            <div className="w-4 h-4 bg-white dark:bg-black rounded-full" />
          </div>
        )}
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-semibold text-gray-900 dark:text-white">
            {message.authorName || (isUser ? "You" : "ChatGPT")}
          </span>
          {message.authorId && message.authorId !== message.authorName && (
            <Badge variant="outline" className="text-xs">
              Collaborator
            </Badge>
          )}
          <span className="text-xs text-gray-500 dark:text-gray-400">{formatTime(messageDate)}</span>
        </div>

        {isEditing ? (
          <div className="space-y-3">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[100px] resize-none bg-white dark:bg-[#2f2f2f] border-gray-300 dark:border-gray-600"
              autoFocus
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSaveEdit}>
                <Check className="w-4 h-4 mr-1" />
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <div className="whitespace-pre-wrap text-gray-900 dark:text-white leading-relaxed">
                {message.content}
                {message.isStreaming && (
                  <span className="inline-block w-2 h-5 bg-gray-400 dark:bg-gray-500 ml-1 animate-pulse" />
                )}
              </div>
            </div>

            {/* Attachments */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {message.attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-[#2f2f2f] rounded-lg text-sm"
                  >
                    {attachment.type === "image" ? (
                      <>
                        <ImageIcon className="w-4 h-4 text-blue-600" />
                        <img
                          src={attachment.url || "/placeholder.svg"}
                          alt={attachment.name}
                          className="max-w-xs max-h-48 rounded object-cover"
                        />
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        <span className="truncate max-w-[200px] text-gray-900 dark:text-white">{attachment.name}</span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Message Actions */}
            {canEdit && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCopy}
                  className="h-8 px-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  <Copy className="w-4 h-4" />
                  {copied ? "Copied!" : "Copy"}
                </Button>

                {isUser && !message.authorId && !isSharedMode && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onStartEdit}
                    className="h-8 px-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </Button>
                )}

                {!isSharedMode && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onDelete}
                    className="h-8 px-2 text-gray-500 dark:text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
