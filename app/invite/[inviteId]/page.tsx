"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Loader2, MessageSquare, Check, X } from "lucide-react"
import type { ChatInvite } from "@/types"

interface InvitePageProps {
  params: Promise<{ inviteId: string }>
}

export default function InvitePage({ params }: InvitePageProps) {
  const [inviteId, setInviteId] = useState<string>("")
  const { data: session, status } = useSession()
  const router = useRouter()
  const [invite, setInvite] = useState<ChatInvite | null>(null)
  const [chatTitle, setChatTitle] = useState("")
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params
      setInviteId(resolvedParams.inviteId)
    }
    getParams()
  }, [params])

  useEffect(() => {
    if (inviteId) {
      fetchInvite()
    }
  }, [inviteId])

  const fetchInvite = async () => {
    if (!inviteId) return

    try {
      const response = await fetch(`/api/invites/${inviteId}`)
      if (response.ok) {
        const data = await response.json()
        setInvite(data.invite)
        setChatTitle(data.chatTitle)
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Invite not found")
      }
    } catch (err) {
      setError("Failed to load invite")
    } finally {
      setLoading(false)
    }
  }

  const handleInviteAction = async (action: "accept" | "decline") => {
    if (!session?.user?.id) {
      router.push("/auth/signin")
      return
    }

    setProcessing(true)
    try {
      const response = await fetch(`/api/invites/${inviteId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      })

      if (response.ok) {
        const data = await response.json()
        if (action === "accept" && data.chatId) {
          router.push(`/?chat=${data.chatId}`)
        } else {
          router.push("/")
        }
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to process invite")
      }
    } catch (err) {
      setError("Failed to process invite")
    } finally {
      setProcessing(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Invalid Invite</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push("/")} className="w-full">
              Go to Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (!session?.user?.id) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Sign in Required</CardTitle>
            <CardDescription>You need to sign in to accept this invitation</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push("/auth/signin")} className="w-full">
              Sign In
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Avatar className="w-16 h-16 mx-auto mb-4">
            <AvatarFallback className="bg-blue-600 text-white">
              <MessageSquare className="w-8 h-8" />
            </AvatarFallback>
          </Avatar>
          <CardTitle>Chat Invitation</CardTitle>
          <CardDescription>
            {invite?.inviterName} invited you to collaborate on "{chatTitle}"
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="text-center">
            <Badge variant="secondary" className="mb-2">
              {invite?.role === "editor" ? "Editor Access" : "View Only"}
            </Badge>
            <p className="text-sm text-gray-600">
              {invite?.role === "editor"
                ? "You'll be able to send messages and participate in the conversation"
                : "You'll be able to view the conversation but not send messages"}
            </p>
          </div>

          <div className="text-xs text-gray-500 text-center">Invited to: {invite?.inviteeEmail}</div>
        </CardContent>

        <CardFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleInviteAction("decline")}
            disabled={processing}
            className="flex-1"
          >
            <X className="w-4 h-4 mr-2" />
            Decline
          </Button>
          <Button onClick={() => handleInviteAction("accept")} disabled={processing} className="flex-1">
            {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
            Accept
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
