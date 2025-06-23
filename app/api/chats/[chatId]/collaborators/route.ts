import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import type { Chat, ChatInvite } from "@/types"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { nanoid } from "nanoid"

export async function GET(request: NextRequest, { params }: { params: Promise<{ chatId: string }> }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { chatId } = await params
    const userId = session.user.id

    const database = await getDatabase()
    const chats = database.collection<Chat>("chats")

    const chat = await chats.findOne({ id: chatId })
    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 })
    }

    // Check if user has access to this chat
    const hasAccess =
      chat.userId === userId || chat.collaborators?.some((c) => c.userId === userId) || chat.shareSettings?.isPublic

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    return NextResponse.json(chat.collaborators || [])
  } catch (error) {
    console.error("Error fetching collaborators:", error)
    return NextResponse.json({ error: "Failed to fetch collaborators" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ chatId: string }> }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { chatId } = await params
    const userId = session.user.id
    const { email, role = "viewer" } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const database = await getDatabase()
    const chats = database.collection<Chat>("chats")
    const users = database.collection("users")
    const invites = database.collection<ChatInvite>("chat_invites")

    // Check if user can invite others
    const chat = await chats.findOne({ id: chatId })
    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 })
    }

    const canInvite =
      chat.userId === userId ||
      chat.collaborators?.some((c) => c.userId === userId && (c.role === "owner" || c.role === "editor")) ||
      chat.shareSettings?.allowInvites

    if (!canInvite) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 })
    }

    // Check if user exists
    const inviteeUser = await users.findOne({ email })
    if (!inviteeUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if user is already a collaborator
    const isAlreadyCollaborator = chat.collaborators?.some((c) => c.userId === inviteeUser.id)
    if (isAlreadyCollaborator) {
      return NextResponse.json({ error: "User is already a collaborator" }, { status: 400 })
    }

    // Create invite
    const invite: ChatInvite = {
      id: nanoid(),
      chatId,
      inviterId: userId,
      inviterName: session.user.name || "Unknown",
      inviteeEmail: email,
      role: role as "editor" | "viewer",
      status: "pending",
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    }

    await invites.insertOne(invite)

    // TODO: Send email notification to invitee

    return NextResponse.json({ success: true, inviteId: invite.id })
  } catch (error) {
    console.error("Error inviting collaborator:", error)
    return NextResponse.json({ error: "Failed to send invite" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ chatId: string }> }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { chatId } = await params
    const userId = session.user.id
    const { collaboratorId } = await request.json()

    const database = await getDatabase()
    const chats = database.collection<Chat>("chats")

    // Check permissions
    const chat = await chats.findOne({ id: chatId })
    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 })
    }

    const isOwner = chat.userId === userId
    const isSelfRemoval = collaboratorId === userId

    if (!isOwner && !isSelfRemoval) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 })
    }

    // Remove collaborator
    const result = await chats.updateOne(
      { id: chatId },
      {
        $pull: { collaborators: { userId: collaboratorId } },
        $set: { updatedAt: new Date() },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Failed to remove collaborator" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing collaborator:", error)
    return NextResponse.json({ error: "Failed to remove collaborator" }, { status: 500 })
  }
}
