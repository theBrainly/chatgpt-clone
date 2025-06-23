import { getDatabase } from "./mongodb"

export async function initializeDatabase() {
  try {
    const database = await getDatabase()

    // Create indexes for better performance
    const chats = database.collection("chats")
    const users = database.collection("users")
    const memories = database.collection("memories")

    // Create indexes for chats collection
    await chats.createIndex({ userId: 1, updatedAt: -1 }) // For fetching user chats sorted by update time
    await chats.createIndex({ id: 1, userId: 1 }) // For finding specific user chats
    await chats.createIndex({ userId: 1, createdAt: -1 }) // For fetching user chats sorted by creation time

    // Create indexes for users collection
    await users.createIndex({ email: 1 }, { unique: true }) // Unique email constraint
    await users.createIndex({ id: 1 }, { unique: true }) // Unique user ID constraint

    // Create indexes for memories collection
    await memories.createIndex({ userId: 1 }) // For fetching user memories
    await memories.createIndex({ userId: 1, key: 1 }, { unique: true }) // Unique memory key per user

    console.log("Database indexes created successfully")
  } catch (error) {
    console.error("Error initializing database:", error)
  }
}
