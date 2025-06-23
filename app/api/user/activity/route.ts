import { type NextRequest, NextResponse } from "next/server"
import { userManager } from "@/lib/user-manager"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const userAgent = request.headers.get("user-agent") || "unknown"

    await userManager.trackUserActivity(session.user.id, {
      ip,
      userAgent,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error tracking user activity:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await userManager.getUser(session.user.id)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      activity: user.activity,
      lastActiveAt: user.lastActiveAt,
      lastLoginAt: user.lastLoginAt,
    })
  } catch (error) {
    console.error("Error fetching user activity:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
