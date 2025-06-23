"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { ActiveUser } from "@/types"

interface ActiveUsersProps {
  activeUsers: ActiveUser[]
  className?: string
}

export function ActiveUsers({ activeUsers, className }: ActiveUsersProps) {
  if (activeUsers.length === 0) return null

  return (
    <TooltipProvider>
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="text-sm text-gray-500">Active:</span>
        <div className="flex -space-x-2">
          {activeUsers.slice(0, 5).map((user) => (
            <Tooltip key={user.userId}>
              <TooltipTrigger>
                <div className="relative">
                  <Avatar className="w-6 h-6 border-2 border-white">
                    <AvatarImage src={user.avatar || "/placeholder.svg"} />
                    <AvatarFallback className="text-xs">{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  {user.isTyping && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-center">
                  <p className="font-medium">{user.name}</p>
                  {user.isTyping && <p className="text-xs text-blue-400">typing...</p>}
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
          {activeUsers.length > 5 && (
            <div className="w-6 h-6 bg-gray-200 rounded-full border-2 border-white flex items-center justify-center">
              <span className="text-xs text-gray-600">+{activeUsers.length - 5}</span>
            </div>
          )}
        </div>
        {activeUsers.some((user) => user.isTyping) && (
          <Badge variant="secondary" className="text-xs">
            Someone is typing...
          </Badge>
        )}
      </div>
    </TooltipProvider>
  )
}
