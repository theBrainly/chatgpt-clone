import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import type { Chat } from "@/types"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const database = await getDatabase()
    const chats = database.collection<Chat>("chats")

    // Fetch chats with proper sorting and user filtering
    const userChats = await chats
      .find({ userId }) // Only fetch chats belonging to this user
      .sort({ updatedAt: -1 }) // Sort by most recently updated
      .toArray()

    // Ensure all chats have the required fields
    const sanitizedChats = userChats.map((chat) => ({
      ...chat,
      messages: chat.messages || [],
      title: chat.title || "New Chat",
      createdAt: chat.createdAt || new Date(),
      updatedAt: chat.updatedAt || new Date(),
    }))

    return NextResponse.json(sanitizedChats)
  } catch (error) {
    console.error("Error fetching chats:", error)
    return NextResponse.json({ error: "Failed to fetch chats" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title } = await request.json()
    const userId = session.user.id

    // Generate unique chat ID
    const chatId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const newChat: Chat = {
      id: chatId,
      title: title || "New Chat",
      messages: [],
      userId, // Ensure userId is properly set
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const database = await getDatabase()
    const chats = database.collection<Chat>("chats")

    // Insert the new chat
    const result = await chats.insertOne(newChat)

    if (!result.acknowledged) {
      throw new Error("Failed to create chat in database")
    }

    return NextResponse.json(newChat, { status: 201 })
  } catch (error) {
    console.error("Error creating chat:", error)
    return NextResponse.json({ error: "Failed to create chat" }, { status: 500 })
  }
}
