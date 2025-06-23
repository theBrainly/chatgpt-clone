import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import type { ChatInvite, Chat, Collaborator } from "@/types"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: Promise<{ inviteId: string }> }) {
  try {
    const { inviteId } = await params

    const database = await getDatabase()
    const invites = database.collection<ChatInvite>("chat_invites")

    const invite = await invites.findOne({ id: inviteId })
    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 })
    }

    if (invite.status !== "pending" || invite.expiresAt < new Date()) {
      return NextResponse.json({ error: "Invite expired or invalid" }, { status: 400 })
    }

    // Get chat details
    const chats = database.collection<Chat>("chats")
    const chat = await chats.findOne({ id: invite.chatId })

    return NextResponse.json({
      invite,
      chatTitle: chat?.title || "Untitled Chat",
      inviterName: invite.inviterName,
    })
  } catch (error) {
    console.error("Error fetching invite:", error)
    return NextResponse.json({ error: "Failed to fetch invite" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ inviteId: string }> }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { inviteId } = await params
    const { action } = await request.json() // "accept" or "decline"

    const database = await getDatabase()
    const invites = database.collection<ChatInvite>("chat_invites")
    const chats = database.collection<Chat>("chats")

    const invite = await invites.findOne({ id: inviteId })
    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 })
    }

    if (invite.inviteeEmail !== session.user.email) {
      return NextResponse.json({ error: "This invite is not for you" }, { status: 403 })
    }

    if (invite.status !== "pending" || invite.expiresAt < new Date()) {
      return NextResponse.json({ error: "Invite expired or invalid" }, { status: 400 })
    }

    if (action === "accept") {
      // Add user as collaborator
      const collaborator: Collaborator = {
        userId: session.user.id,
        name: session.user.name || "Unknown",
        email: session.user.email || "",
        avatar: session.user.image || undefined,
        role: invite.role,
        joinedAt: new Date(),
        lastActive: new Date(),
        isOnline: true,
      }

      await chats.updateOne(
        { id: invite.chatId },
        {
          $push: { collaborators: collaborator },
          $set: { updatedAt: new Date() },
        },
      )

      // Update invite status
      await invites.updateOne({ id: inviteId }, { $set: { status: "accepted" } })

      return NextResponse.json({ success: true, chatId: invite.chatId })
    } else if (action === "decline") {
      // Update invite status
      await invites.updateOne({ id: inviteId }, { $set: { status: "declined" } })

      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error processing invite:", error)
    return NextResponse.json({ error: "Failed to process invite" }, { status: 500 })
  }
}
