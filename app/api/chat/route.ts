import { openrouter, getOpenRouterModel } from "@/lib/openrouter"
import { streamText } from "ai"
import { getDatabase } from "@/lib/mongodb"
import { memoryManager } from "@/lib/memory"
import { manageContextWindow, createSystemMessage } from "@/lib/context-window"
import type { Message, Chat } from "@/types"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 })
    }

    const { messages, chatId, model: selectedModel } = await req.json()
    const userId = session.user.id

    if (!messages || !Array.isArray(messages)) {
      return new Response("Messages are required", { status: 400 })
    }

    // Get user memory context
    const memoryContext = await memoryManager.buildContextFromMemories(userId)

    // Create system message with memory context
    const systemMessage = createSystemMessage(memoryContext)

    // Manage context window to stay within token limits
    const contextWindow = manageContextWindow([systemMessage, ...messages], 8000)

    // Convert messages to the format expected by the AI SDK
    const formattedMessages = contextWindow.messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }))

    const result = streamText({
      model: openrouter(getOpenRouterModel(selectedModel || "gpt-4-turbo")),
      messages: formattedMessages,
      temperature: 0.7,
      maxTokens: 4000,
    })

    // Store the conversation in MongoDB (in the background)
    if (chatId && userId) {
      storeConversation(chatId, userId, messages).catch(console.error)
    }

    return result.toDataStreamResponse()
  } catch (error) {
    // Log error with more context
    console.error("Chat API error:", error)
    // In development, return error message for debugging
    const isDev = process.env.NODE_ENV !== "production"
    const errorMessage = isDev && error instanceof Error ? error.message : "Internal Server Error"
    return new Response(errorMessage, {
      status: 500,
      headers: { "X-Chat-Error": "1" }
    })
  }
}

async function storeConversation(chatId: string, userId: string, messages: Message[]) {
  try {
    const database = await getDatabase()
    const chats = database.collection<Chat>("chats")

    // Generate a meaningful title from the first user message
    const firstUserMessage = messages.find((msg) => msg.role === "user")
    const title = firstUserMessage ? generateChatTitle(firstUserMessage.content) : "New Chat"

    // Ensure all messages have proper timestamps
    const normalizedMessages = messages.map((msg) => ({
      ...msg,
      timestamp: msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp || Date.now()),
    }))

    await chats.updateOne(
      { id: chatId, userId }, // Ensure both chatId and userId match
      {
        $set: {
          messages: normalizedMessages,
          title,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          id: chatId,
          userId,
          createdAt: new Date(),
        },
      },
      { upsert: true },
    )
  } catch (error) {
    console.error("Error storing conversation:", error)
  }
}

function generateChatTitle(content: string): string {
  const cleanContent = content.trim()
  if (cleanContent.length <= 50) {
    return cleanContent
  }

  // Try to find a natural break point
  const sentences = cleanContent.split(/[.!?]+/)
  if (sentences[0] && sentences[0].length <= 50) {
    return sentences[0].trim()
  }

  // Fallback to word boundary
  const words = cleanContent.split(" ")
  let title = ""
  for (const word of words) {
    if ((title + " " + word).length > 47) break
    title += (title ? " " : "") + word
  }

  return title + "..."
}
