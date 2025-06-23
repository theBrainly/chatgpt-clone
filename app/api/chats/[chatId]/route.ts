import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import type { Chat } from "@/types"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

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

    const chat = await chats.findOne({ id: chatId, userId })

    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 })
    }

    return NextResponse.json(chat)
  } catch (error) {
    console.error("Error fetching chat:", error)
    return NextResponse.json({ error: "Failed to fetch chat" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ chatId: string }> }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { chatId } = await params
    const userId = session.user.id
    const { title, messages } = await request.json()

    const database = await getDatabase()
    const chats = database.collection<Chat>("chats")

    const updateData: Partial<Chat> = {
      updatedAt: new Date(),
    }

    if (title) updateData.title = title
    if (messages) updateData.messages = messages

    const result = await chats.updateOne({ id: chatId, userId }, { $set: updateData })

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating chat:", error)
    return NextResponse.json({ error: "Failed to update chat" }, { status: 500 })
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

    const result = await chats.deleteOne({ id: chatId, userId })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting chat:", error)
    return NextResponse.json({ error: "Failed to delete chat" }, { status: 500 })
  }
}
