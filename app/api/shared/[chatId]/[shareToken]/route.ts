import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import type { Chat } from "@/types"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string; shareToken: string }> },
) {
  try {
    const { chatId, shareToken } = await params

    const database = await getDatabase()
    const chats = database.collection<Chat>("chats")

    // Find the chat
    const chat = await chats.findOne({ id: chatId })
    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 })
    }

    // Check if chat is shared
    if (!chat.isShared || !chat.shareSettings) {
      return NextResponse.json({ error: "Chat is not shared" }, { status: 403 })
    }

    // Verify share token (extract from share link)
    const expectedToken = chat.shareSettings.shareLink?.split("/").pop()
    if (expectedToken !== shareToken) {
      return NextResponse.json({ error: "Invalid share link" }, { status: 403 })
    }

    // Check if share link has expired
    if (chat.shareSettings.expiresAt && new Date() > new Date(chat.shareSettings.expiresAt)) {
      return NextResponse.json({ error: "Share link has expired" }, { status: 403 })
    }

    // Check if public access is allowed
    if (!chat.shareSettings.isPublic) {
      const session = await getServerSession(authOptions)

      // Must be authenticated for private shared chats
      if (!session?.user?.id) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 })
      }

      // Check if user is a collaborator
      const isCollaborator = chat.collaborators?.some((c) => c.userId === session.user.id)
      const isOwner = chat.userId === session.user.id

      if (!isOwner && !isCollaborator) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 })
      }
    }

    // Return chat data (without sensitive information)
    const sanitizedChat = {
      ...chat,
      // Don't expose all collaborator details to public viewers
      collaborators: chat.shareSettings.isPublic
        ? chat.collaborators?.map((c) => ({
            userId: c.userId,
            name: c.name,
            role: c.role,
            isOnline: c.isOnline,
          }))
        : chat.collaborators,
    }

    return NextResponse.json({ chat: sanitizedChat })
  } catch (error) {
    console.error("Error accessing shared chat:", error)
    return NextResponse.json({ error: "Failed to access shared chat" }, { status: 500 })
  }
}
