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

    // Update stats before returning
    const stats = await userManager.updateUserStats(session.user.id)
    const user = await userManager.getUser(session.user.id)

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const joinedDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Recently"
    const lastActive = user.lastActiveAt ? getRelativeTime(user.lastActiveAt) : "Now"

    return NextResponse.json({
      ...stats,
      joinedDate,
      lastActive,
      memberSince: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Recently",
      plan: user.plan || "free",
      planExpiresAt: user.planExpiresAt,
    })
  } catch (error) {
    console.error("Error fetching user stats:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function getRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return "Now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}
