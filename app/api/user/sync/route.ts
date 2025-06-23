import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const database = await getDatabase()

    // Get user's chat count and last activity
    const chats = database.collection("chats")
    const chatCount = await chats.countDocuments({ userId })
    const lastChat = await chats.findOne({ userId }, { sort: { updatedAt: -1 } })

    return NextResponse.json({
      userId,
      chatCount,
      lastActivity: lastChat?.updatedAt || null,
      synced: true,
    })
  } catch (error) {
    console.error("Error syncing user data:", error)
    return NextResponse.json({ error: "Sync failed" }, { status: 500 })
  }
}
