import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import type { Chat, ShareSettings } from "@/types"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { nanoid } from "nanoid"

export async function POST(request: NextRequest, { params }: { params: Promise<{ chatId: string }> }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { chatId } = await params
    const userId = session.user.id
    const { isPublic, allowEditing, allowInvites, expiresAt } = await request.json()

    const database = await getDatabase()
    const chats = database.collection<Chat>("chats")

    // Check if user owns the chat or is an editor
    const chat = await chats.findOne({ id: chatId })
    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 })
    }

    const isOwner = chat.userId === userId
    const isEditor = chat.collaborators?.some((c) => c.userId === userId && c.role === "editor")

    if (!isOwner && !isEditor) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 })
    }

    // Generate share link
    const shareLink = `${process.env.NEXTAUTH_URL}/shared/${chatId}/${nanoid(12)}`

    const shareSettings: ShareSettings = {
      isPublic,
      allowEditing,
      allowInvites,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      shareLink,
    }

    const result = await chats.updateOne(
      { id: chatId },
      {
        $set: {
          isShared: true,
          shareSettings,
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Failed to update chat" }, { status: 500 })
    }

    return NextResponse.json({ shareLink, shareSettings })
  } catch (error) {
    console.error("Error sharing chat:", error)
    return NextResponse.json({ error: "Failed to share chat" }, { status: 500 })
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

    const database = await getDatabase()
    const chats = database.collection<Chat>("chats")

    // Only owner can disable sharing
    const result = await chats.updateOne(
      { id: chatId, userId },
      {
        $set: {
          isShared: false,
          shareSettings: {
            isPublic: false,
            allowEditing: false,
            allowInvites: false,
          },
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Chat not found or permission denied" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error disabling chat sharing:", error)
    return NextResponse.json({ error: "Failed to disable sharing" }, { status: 500 })
  }
}
