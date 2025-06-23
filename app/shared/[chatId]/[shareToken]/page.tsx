"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { ChatInterface } from "@/components/chat/ChatInterface"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Eye, Edit, MessageSquare, AlertTriangle } from "lucide-react"
import type { Chat } from "@/types"

interface SharedChatPageProps {
  params: Promise<{
    chatId: string
    shareToken: string
  }>
}

export default function SharedChatPage({ params }: SharedChatPageProps) {
  const [chatId, setChatId] = useState<string>("")
  const [shareToken, setShareToken] = useState<string>("")
  const { data: session, status } = useSession()
  const router = useRouter()
  const [chat, setChat] = useState<Chat | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [hasAccess, setHasAccess] = useState(false)
  const [accessLevel, setAccessLevel] = useState<"viewer" | "editor" | "none">("none")

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params
      setChatId(resolvedParams.chatId)
      setShareToken(resolvedParams.shareToken)
    }
    getParams()
  }, [params])

  useEffect(() => {
    if (chatId && shareToken) {
      checkAccess()
    }
  }, [chatId, shareToken, session])

  const checkAccess = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/shared/${chatId}/${shareToken}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setChat(data.chat)
        setHasAccess(true)

        // Determine access level
        if (data.chat.shareSettings?.allowEditing && session?.user?.id) {
          // Check if user is a collaborator
          const isCollaborator = data.chat.collaborators?.some((c: any) => c.userId === session.user.id)
          setAccessLevel(isCollaborator ? "editor" : data.chat.shareSettings.allowEditing ? "editor" : "viewer")
        } else {
          setAccessLevel("viewer")
        }
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Access denied")
        setHasAccess(false)
      }
    } catch (err) {
      console.error("Error checking access:", err)
      setError("Failed to load shared chat")
      setHasAccess(false)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinAsCollaborator = async () => {
    if (!session?.user?.id || !chat) return

    try {
      const response = await fetch(`/api/shared/${chatId}/${shareToken}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        // Refresh the chat data
        await checkAccess()
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to join chat")
      }
    } catch (err) {
      console.error("Error joining chat:", err)
      setError("Failed to join chat")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading shared chat...</p>
        </div>
      </div>
    )
  }

  if (error || !hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-red-600">Access Denied</CardTitle>
            <CardDescription>
              {error || "This shared chat is no longer available or you don't have permission to view it."}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => router.push("/")} className="w-full">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!chat) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Chat not found</p>
        </div>
      </div>
    )
  }

  // Show access prompt for unauthenticated users who could potentially edit
  if (!session?.user?.id && chat.shareSettings?.allowEditing) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle>Shared Chat: {chat.title}</CardTitle>
            <CardDescription>
              This chat allows collaboration. Sign in to participate in the conversation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Badge variant="secondary" className="gap-1">
                <Eye className="w-3 h-3" />
                View Only
              </Badge>
              <span className="text-sm text-gray-500">without signing in</span>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => router.push("/auth/signin")} className="flex-1">
                Sign In to Collaborate
              </Button>
              <Button variant="outline" onClick={() => setAccessLevel("viewer")} className="flex-1">
                View Only
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-screen bg-white">
      {/* Shared Chat Header */}
      <div className="border-b bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="font-semibold text-gray-900">Shared Chat: {chat.title}</h1>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>by {chat.collaborators?.find((c) => c.role === "owner")?.name || "Unknown"}</span>
                <Badge variant="outline" className="gap-1">
                  {accessLevel === "editor" ? (
                    <>
                      <Edit className="w-3 h-3" />
                      Can Edit
                    </>
                  ) : (
                    <>
                      <Eye className="w-3 h-3" />
                      View Only
                    </>
                  )}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {session?.user?.id && accessLevel === "viewer" && chat.shareSettings?.allowEditing && (
              <Button onClick={handleJoinAsCollaborator} size="sm" variant="outline">
                Join as Collaborator
              </Button>
            )}
            <Button onClick={() => router.push("/")} size="sm" variant="outline">
              Go to My Chats
            </Button>
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="h-[calc(100vh-80px)]">
        <ChatInterface
          chatId={chatId}
          userId={session?.user?.id || "anonymous"}
          isSharedMode={true}
          canEdit={accessLevel === "editor" && !!session?.user?.id}
          sharedChat={chat}
        />
      </div>
    </div>
  )
}
