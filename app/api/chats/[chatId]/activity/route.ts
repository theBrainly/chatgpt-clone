import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import type { Chat, ActiveUser } from "@/types"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(request: NextRequest, { params }: { params: Promise<{ chatId: string }> }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { chatId } = await params
    const userId = session.user.id
    const { activity } = await request.json() // "join", "leave", "typing", "stop_typing"

    const database = await getDatabase()
    const chats = database.collection<Chat>("chats")
    const activity_collection = database.collection("chat_activity")

    // Check if user has access to this chat
    const chat = await chats.findOne({ id: chatId })
    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 })
    }

    const hasAccess =
      chat.userId === userId || chat.collaborators?.some((c) => c.userId === userId) || chat.shareSettings?.isPublic

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const activeUser: ActiveUser = {
      userId,
      name: session.user.name || "Unknown",
      avatar: session.user.image || undefined,
      lastSeen: new Date(),
      isTyping: activity === "typing",
    }

    if (activity === "join" || activity === "typing") {
      // Update or insert user activity
      await activity_collection.updateOne(
        { chatId, userId },
        {
          $set: {
            ...activeUser,
            isTyping: activity === "typing",
          },
        },
        { upsert: true },
      )

      // Update collaborator last active time
      await chats.updateOne(
        { id: chatId, "collaborators.userId": userId },
        {
          $set: {
            "collaborators.$.lastActive": new Date(),
            "collaborators.$.isOnline": true,
          },
        },
      )
    } else if (activity === "leave" || activity === "stop_typing") {
      if (activity === "leave") {
        await activity_collection.deleteOne({ chatId, userId })

        // Update collaborator online status
        await chats.updateOne(
          { id: chatId, "collaborators.userId": userId },
          {
            $set: {
              "collaborators.$.isOnline": false,
              "collaborators.$.lastActive": new Date(),
            },
          },
        )
      } else {
        await activity_collection.updateOne({ chatId, userId }, { $set: { isTyping: false, lastSeen: new Date() } })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating activity:", error)
    return NextResponse.json({ error: "Failed to update activity" }, { status: 500 })
  }
}

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
    const activity_collection = database.collection("chat_activity")

    // Check access
    const chat = await chats.findOne({ id: chatId })
    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 })
    }

    const hasAccess =
      chat.userId === userId || chat.collaborators?.some((c) => c.userId === userId) || chat.shareSettings?.isPublic

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Get active users (last seen within 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    const activeUsers = await activity_collection
      .find({
        chatId,
        lastSeen: { $gte: fiveMinutesAgo },
      })
      .toArray()

    return NextResponse.json(activeUsers)
  } catch (error) {
    console.error("Error fetching activity:", error)
    return NextResponse.json({ error: "Failed to fetch activity" }, { status: 500 })
  }
}
