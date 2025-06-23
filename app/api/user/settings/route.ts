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

    const database = await getDatabase()
    const settings = database.collection("user_settings")

    const userSettings = await settings.findOne({ userId: session.user.id })

    return NextResponse.json(userSettings?.settings || {})
  } catch (error) {
    console.error("Error fetching user settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const settingsData = await request.json()

    const database = await getDatabase()
    const settings = database.collection("user_settings")

    await settings.updateOne(
      { userId: session.user.id },
      {
        $set: {
          settings: settingsData,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          userId: session.user.id,
          createdAt: new Date(),
        },
      },
      { upsert: true },
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating user settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
