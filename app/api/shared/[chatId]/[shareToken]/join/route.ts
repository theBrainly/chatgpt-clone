import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import type { Chat, Collaborator } from "@/types"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string; shareToken: string }> },
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const { chatId, shareToken } = await params

    const database = await getDatabase()
    const chats = database.collection<Chat>("chats")

    // Find and verify the chat
    const chat = await chats.findOne({ id: chatId })
    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 })
    }

    // Verify sharing is enabled and token is valid
    if (!chat.isShared || !chat.shareSettings) {
      return NextResponse.json({ error: "Chat is not shared" }, { status: 403 })
    }

    const expectedToken = chat.shareSettings.shareLink?.split("/").pop()
    if (expectedToken !== shareToken) {
      return NextResponse.json({ error: "Invalid share link" }, { status: 403 })
    }

    // Check if share link has expired
    if (chat.shareSettings.expiresAt && new Date() > new Date(chat.shareSettings.expiresAt)) {
      return NextResponse.json({ error: "Share link has expired" }, { status: 403 })
    }

    // Check if editing is allowed
    if (!chat.shareSettings.allowEditing) {
      return NextResponse.json({ error: "Editing is not allowed for this shared chat" }, { status: 403 })
    }

    // Check if user is already a collaborator
    const isAlreadyCollaborator = chat.collaborators?.some((c) => c.userId === session.user.id)
    if (isAlreadyCollaborator) {
      return NextResponse.json({ error: "You are already a collaborator" }, { status: 400 })
    }

    // Check if user is the owner
    if (chat.userId === session.user.id) {
      return NextResponse.json({ error: "You are the owner of this chat" }, { status: 400 })
    }

    // Add user as collaborator
    const newCollaborator: Collaborator = {
      userId: session.user.id,
      name: session.user.name || "Unknown",
      email: session.user.email || "",
      avatar: session.user.image || undefined,
      role: "editor", // Default role for shared link joins
      joinedAt: new Date(),
      lastActive: new Date(),
      isOnline: true,
    }

    const result = await chats.updateOne(
      { id: chatId },
      {
        $push: { collaborators: newCollaborator },
        $set: { updatedAt: new Date() },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Failed to join chat" }, { status: 500 })
    }

    return NextResponse.json({ success: true, role: "editor" })
  } catch (error) {
    console.error("Error joining shared chat:", error)
    return NextResponse.json({ error: "Failed to join chat" }, { status: 500 })
  }
}
