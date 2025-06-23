import type { Message, ChatContextWindow } from "@/types"

// Approximate token counting (rough estimation)
function estimateTokens(text: string): number {
  // GPT-4 uses roughly 1 token per 4 characters for English text
  return Math.ceil(text.length / 4)
}

export function manageContextWindow(
  messages: Message[],
  maxTokens = 8000, // Leave room for response
): ChatContextWindow {
  let currentTokens = 0
  const managedMessages: Message[] = []

  // Start from the most recent messages and work backwards
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i]
    const messageTokens = estimateTokens(message.content)

    if (currentTokens + messageTokens > maxTokens) {
      // If adding this message would exceed the limit, stop here
      break
    }

    managedMessages.unshift(message)
    currentTokens += messageTokens
  }

  // Always include system message if it exists
  const systemMessage = messages.find((m) => m.role === "system")
  if (systemMessage && !managedMessages.some((m) => m.role === "system")) {
    const systemTokens = estimateTokens(systemMessage.content)
    if (currentTokens + systemTokens <= maxTokens) {
      managedMessages.unshift(systemMessage)
      currentTokens += systemTokens
    }
  }

  return {
    maxTokens,
    currentTokens,
    messages: managedMessages,
  }
}

export function createSystemMessage(userMemoryContext: string): Message {
  const systemContent = `You are ChatGPT, a large language model trained by OpenAI. Answer as concisely as possible.

${userMemoryContext}

Current date: ${new Date().toLocaleDateString()}`

  return {
    id: "system",
    role: "system",
    content: systemContent,
    timestamp: new Date(),
  }
}
