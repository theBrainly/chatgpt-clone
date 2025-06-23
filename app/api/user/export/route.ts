import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
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

    // Get user data
    const users = database.collection("users")
    const user = await users.findOne({ id: userId })

    // Get user chats
    const chats = database.collection("chats")
    const userChats = await chats.find({ userId }).toArray()

    // Get user settings
    const settings = database.collection("user_settings")
    const userSettings = await settings.findOne({ userId })

    // Get user memories
    const memories = database.collection("memories")
    const userMemories = await memories.find({ userId }).toArray()

    // Compile export data
    const exportData = {
      user: {
        id: user?.id,
        name: user?.name,
        email: user?.email,
        createdAt: user?.createdAt,
        updatedAt: user?.updatedAt,
      },
      chats: userChats.map((chat) => ({
        id: chat.id,
        title: chat.title,
        messages: chat.messages,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
      })),
      settings: userSettings?.settings || {},
      memories: userMemories,
      exportedAt: new Date().toISOString(),
    }

    const jsonData = JSON.stringify(exportData, null, 2)

    return new NextResponse(jsonData, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="chatgpt-data-${new Date().toISOString().split("T")[0]}.json"`,
      },
    })
  } catch (error) {
    console.error("Error exporting user data:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
