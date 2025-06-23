"use client"

import { useState, useEffect, useRef } from "react"
import { useChat } from "@/hooks/useChat"
import { useFileUpload } from "@/hooks/useFileUpload"
import { useCollaboration } from "@/hooks/useCollaboration"
import type { Attachment, Chat } from "@/types"
import { ChatMessage } from "./ChatMessage"
import { ChatInput } from "./ChatInput"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { RefreshCw, Square, Loader2 } from "lucide-react"
import { ModelSelector } from "./ModelSelector"
import type { OpenRouterModel } from "@/lib/openrouter"

interface ChatInterfaceProps {
  chatId?: string
  userId: string
  onTitleChange?: (title: string) => void
  onChatUpdate?: (chat: Chat) => void
  isSharedMode?: boolean
  canEdit?: boolean
  sharedChat?: Chat
}

export function ChatInterface({
  chatId,
  userId,
  onTitleChange,
  onChatUpdate,
  isSharedMode = false,
  canEdit = true,
  sharedChat,
}: ChatInterfaceProps) {
  const {
    messages,
    isLoading,
    loadingChat,
    chatTitle,
    sendMessage,
    editMessage,
    deleteMessage,
    stopGeneration,
    regenerateResponse,
    editingMessageId,
    setEditingMessageId,
  } = useChat({
    chatId,
    userId,
    onTitleUpdate: onTitleChange,
    onChatUpdate,
    isSharedMode,
    sharedChat,
  })

  const { uploadFile, uploading, uploadProgress } = useFileUpload()
  const { startTyping, stopTyping } = useCollaboration({
    chatId,
    enabled: !!chatId && !isSharedMode,
  })

  const [input, setInput] = useState("")
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [selectedModel, setSelectedModel] = useState<OpenRouterModel>("gpt-4-turbo")

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async (content: string) => {
    if (!content.trim() && attachments.length === 0) return
    if (!canEdit) return

    if (!isSharedMode) {
      stopTyping()
    }

    await sendMessage(content, attachments, selectedModel)
    setAttachments([])
    setInput("")
  }

  const handleInputChange = (value: string) => {
    setInput(value)

    if (chatId && !isSharedMode) {
      if (value.trim() && !input.trim()) {
        startTyping()
      } else if (!value.trim() && input.trim()) {
        stopTyping()
      }
    }
  }

  const handleFileUpload = async (files: File[]) => {
    if (!canEdit) return

    try {
      const uploadedFiles = await Promise.all(files.map((file) => uploadFile(file)))
      setAttachments((prev) => [...prev, ...uploadedFiles])
    } catch (error) {
      console.error("File upload failed:", error)
    }
  }

  const removeAttachment = (attachmentId: string) => {
    setAttachments((prev) => prev.filter((att) => att.id !== attachmentId))
  }

  if (loadingChat) {
    return (
      <div className="flex flex-col h-full bg-white dark:bg-[#212121]">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 dark:text-gray-400">Loading chat...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#212121] overflow-hidden">
      {/* Chat Messages Area */}
      <div className="flex-1 overflow-hidden">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-2xl mx-auto px-4">
              <h1 className="text-3xl font-medium text-gray-900 dark:text-white mb-8">Ready when you are.</h1>
            </div>
          </div>
        ) : (
          <ScrollArea ref={scrollAreaRef} className="h-full">
            <div className="max-w-3xl mx-auto py-4 px-4">
              <div className="space-y-6">
                {messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    isEditing={editingMessageId === message.id}
                    onEdit={(content) => editMessage(message.id, content)}
                    onDelete={() => deleteMessage(message.id)}
                    onStartEdit={() => setEditingMessageId(message.id)}
                    onCancelEdit={() => setEditingMessageId(null)}
                    canEdit={canEdit}
                    isSharedMode={isSharedMode}
                  />
                ))}

                {isLoading && (
                  <div className="flex justify-center py-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={stopGeneration}
                      className="flex items-center gap-2 bg-white dark:bg-[#2f2f2f] border-gray-300 dark:border-gray-600"
                    >
                      <Square className="w-4 h-4" />
                      Stop generating
                    </Button>
                  </div>
                )}
              </div>
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        )}

        {messages.length > 0 && !isLoading && canEdit && (
          <div className="flex justify-center py-2 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="ghost"
              size="sm"
              onClick={regenerateResponse}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              <RefreshCw className="w-4 h-4" />
              Regenerate response
            </Button>
          </div>
        )}
      </div>

      {/* Chat Input - Fixed at bottom */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-[#212121]">
        <div className="max-w-3xl mx-auto space-y-3">
          {canEdit && (
            <div className="flex justify-center">
              <ModelSelector selectedModel={selectedModel} onModelChange={setSelectedModel} disabled={isLoading} />
            </div>
          )}
          <ChatInput
            value={input}
            onChange={handleInputChange}
            onSend={handleSendMessage}
            onFileUpload={handleFileUpload}
            attachments={attachments}
            onRemoveAttachment={removeAttachment}
            disabled={isLoading || !canEdit}
            uploading={uploading}
            uploadProgress={uploadProgress}
          />
        </div>
      </div>
    </div>
  )
}
