"use client"

import type React from "react"
import { useState, useRef, type KeyboardEvent } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Send, Paperclip, X, ImageIcon, FileText, Wrench, Mic } from "lucide-react"
import type { Attachment } from "@/types"
import { cn } from "@/lib/utils"

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSend: (message: string) => void
  onFileUpload: (files: File[]) => void
  attachments: Attachment[]
  onRemoveAttachment: (id: string) => void
  disabled?: boolean
  uploading?: boolean
  uploadProgress?: number
}

export function ChatInput({
  value,
  onChange,
  onSend,
  onFileUpload,
  attachments,
  onRemoveAttachment,
  disabled = false,
  uploading = false,
  uploadProgress = 0,
}: ChatInputProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = () => {
    if (value.trim() || attachments.length > 0) {
      onSend(value)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      onFileUpload(files)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      onFileUpload(files)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className="space-y-3">
      {/* Upload Progress */}
      {uploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>Uploading files...</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-[#2f2f2f] rounded-lg text-sm max-w-xs"
            >
              {attachment.type === "image" ? (
                <ImageIcon className="w-4 h-4 text-blue-600 flex-shrink-0" />
              ) : (
                <FileText className="w-4 h-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="truncate font-medium text-gray-900 dark:text-white">{attachment.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(attachment.size)}</div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onRemoveAttachment(attachment.id)}
                className="h-6 w-6 p-0 hover:bg-gray-200 dark:hover:bg-[#3f3f3f]"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div
        className={cn(
          "relative border rounded-2xl transition-colors bg-white dark:bg-[#2f2f2f] border-gray-300 dark:border-gray-600",
          isDragOver && "border-blue-500 bg-blue-50 dark:bg-blue-900/20",
          disabled && "opacity-50",
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything"
          className="min-h-[52px] max-h-[200px] resize-none border-0 focus-visible:ring-0 pr-24 bg-transparent text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
          disabled={disabled}
        />

        <div className="absolute bottom-2 right-2 flex items-center gap-1">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,.pdf,.txt,.doc,.docx"
          />

          <Button
            size="sm"
            variant="ghost"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || uploading}
            className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-[#3f3f3f]"
          >
            <Paperclip className="w-4 h-4" />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            disabled={disabled}
            className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-[#3f3f3f]"
          >
            <Wrench className="w-4 h-4" />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            disabled={disabled}
            className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-[#3f3f3f]"
          >
            <Mic className="w-4 h-4" />
          </Button>

          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={disabled || (!value.trim() && attachments.length === 0)}
            className="h-8 w-8 p-0 bg-gray-200 dark:bg-[#3f3f3f] hover:bg-gray-300 dark:hover:bg-[#4f4f4f] disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        {isDragOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 bg-opacity-90 rounded-2xl">
            <div className="text-blue-600 dark:text-blue-400 font-medium">Drop files here to upload</div>
          </div>
        )}
      </div>

      <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
        ChatGPT can make mistakes. Consider checking important information.
      </div>
    </div>
  )
}
