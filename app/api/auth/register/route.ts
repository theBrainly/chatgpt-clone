import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { getDatabase } from "@/lib/mongodb"
import type { User } from "@/types"

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    const database = await getDatabase()
    const users = database.collection<User>("users")

    // Check if user already exists
    const existingUser = await users.findOne({ email })
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const newUser: User = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      email,
      password: hashedPassword,
      provider: "credentials",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await users.insertOne(newUser)

    // Return user without password
    const { password: _, ...userWithoutPassword } = newUser

    return NextResponse.json({ user: userWithoutPassword }, { status: 201 })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
