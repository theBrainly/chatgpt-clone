import { type NextRequest, NextResponse } from "next/server"
import { memoryManager } from "@/lib/memory"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { key, value, context } = await request.json()
    const userId = session.user.id

    if (!key || !value) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    await memoryManager.storeMemory(userId, key, value, context || "")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Memory storage error:", error)
    return NextResponse.json({ error: "Failed to store memory" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const memories = await memoryManager.getMemories(userId)

    return NextResponse.json(memories)
  } catch (error) {
    console.error("Memory retrieval error:", error)
    return NextResponse.json({ error: "Failed to retrieve memories" }, { status: 500 })
  }
}
