import { getDatabase } from "./mongodb"
import type { Memory } from "@/types"

export class MemoryManager {
  private db

  constructor() {
    this.db = getDatabase()
  }

  async storeMemory(userId: string, key: string, value: string, context: string): Promise<void> {
    const database = await this.db
    const memories = database.collection<Memory>("memories")

    await memories.updateOne(
      { userId, key },
      {
        $set: {
          value,
          context,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId,
          key,
          createdAt: new Date(),
        },
      },
      { upsert: true },
    )
  }

  async getMemories(userId: string): Promise<Memory[]> {
    const database = await this.db
    const memories = database.collection<Memory>("memories")

    return await memories.find({ userId }).toArray()
  }

  async getMemory(userId: string, key: string): Promise<Memory | null> {
    const database = await this.db
    const memories = database.collection<Memory>("memories")

    return await memories.findOne({ userId, key })
  }

  async deleteMemory(userId: string, key: string): Promise<void> {
    const database = await this.db
    const memories = database.collection<Memory>("memories")

    await memories.deleteOne({ userId, key })
  }

  async buildContextFromMemories(userId: string): Promise<string> {
    const memories = await this.getMemories(userId)

    if (memories.length === 0) return ""

    const contextParts = memories.map((memory) => `${memory.key}: ${memory.value} (Context: ${memory.context})`)

    return `User Memory Context:\n${contextParts.join("\n")}\n\n`
  }
}

export const memoryManager = new MemoryManager()
