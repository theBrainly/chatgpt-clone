import { createOpenAI } from "@ai-sdk/openai"

// OpenRouter configuration
export const openrouter = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  headers: {
    "HTTP-Referer": process.env.NEXTAUTH_URL || "http://localhost:3000",
    "X-Title": "ChatGPT Clone",
  },
})

// Available models on OpenRouter
export const OPENROUTER_MODELS = {
  // OpenAI Models
  "gpt-4-turbo": "openai/gpt-4-turbo",
  "gpt-4": "openai/gpt-4",
  "gpt-3.5-turbo": "openai/gpt-3.5-turbo",

  // Anthropic Models
  "claude-3-opus": "anthropic/claude-3-opus",
  "claude-3-sonnet": "anthropic/claude-3-sonnet",
  "claude-3-haiku": "anthropic/claude-3-haiku",

  // Google Models
  "gemini-pro": "google/gemini-pro",
  "gemini-pro-vision": "google/gemini-pro-vision",

  // Meta Models
  "llama-2-70b": "meta-llama/llama-2-70b-chat",
  "llama-3-70b": "meta-llama/llama-3-70b-instruct",

  // Mistral Models
  "mistral-7b": "mistralai/mistral-7b-instruct",
  "mixtral-8x7b": "mistralai/mixtral-8x7b-instruct",

  // Other Popular Models
  "perplexity-70b": "perplexity/llama-3-sonar-large-32k-online",
  "cohere-command": "cohere/command",
} as const

export type OpenRouterModel = keyof typeof OPENROUTER_MODELS

// Get the full model name for OpenRouter
export function getOpenRouterModel(model: OpenRouterModel): string {
  return OPENROUTER_MODELS[model] || OPENROUTER_MODELS["gpt-4-turbo"]
}

// Model pricing and capabilities (for UI display)
export const MODEL_INFO = {
  "gpt-4-turbo": {
    name: "GPT-4 Turbo",
    provider: "OpenAI",
    description: "Most capable GPT-4 model with 128k context",
    contextLength: 128000,
    pricing: { input: 0.01, output: 0.03 },
    capabilities: ["text", "vision", "function-calling"],
  },
  "gpt-4": {
    name: "GPT-4",
    provider: "OpenAI",
    description: "High-intelligence flagship model",
    contextLength: 8192,
    pricing: { input: 0.03, output: 0.06 },
    capabilities: ["text", "function-calling"],
  },
  "claude-3-opus": {
    name: "Claude 3 Opus",
    provider: "Anthropic",
    description: "Most powerful Claude model",
    contextLength: 200000,
    pricing: { input: 0.015, output: 0.075 },
    capabilities: ["text", "vision", "analysis"],
  },
  "claude-3-sonnet": {
    name: "Claude 3 Sonnet",
    provider: "Anthropic",
    description: "Balanced performance and speed",
    contextLength: 200000,
    pricing: { input: 0.003, output: 0.015 },
    capabilities: ["text", "vision", "analysis"],
  },
  "gemini-pro": {
    name: "Gemini Pro",
    provider: "Google",
    description: "Google's most capable model",
    contextLength: 32768,
    pricing: { input: 0.0005, output: 0.0015 },
    capabilities: ["text", "reasoning"],
  },
  "llama-3-70b": {
    name: "Llama 3 70B",
    provider: "Meta",
    description: "Open-source flagship model",
    contextLength: 8192,
    pricing: { input: 0.0009, output: 0.0009 },
    capabilities: ["text", "reasoning"],
  },
  "mixtral-8x7b": {
    name: "Mixtral 8x7B",
    provider: "Mistral AI",
    description: "High-quality mixture of experts",
    contextLength: 32768,
    pricing: { input: 0.0007, output: 0.0007 },
    capabilities: ["text", "multilingual"],
  },
} as const
