import { type NextRequest, NextResponse } from "next/server"
import { userManager } from "@/lib/user-manager"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

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

    // Return user profile without sensitive data
    const { password, ...profile } = user
    return NextResponse.json(profile)
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const updates = await request.json()

    // Track user activity
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const userAgent = request.headers.get("user-agent") || "unknown"

    await userManager.trackUserActivity(session.user.id, {
      ip,
      userAgent,
    })

    // Update user profile
    const success = await userManager.updateUser(session.user.id, updates)

    if (!success) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Update stats after profile change
    await userManager.updateUserStats(session.user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating user profile:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
