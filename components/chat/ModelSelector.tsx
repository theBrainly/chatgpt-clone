"use client"

import { useState } from "react"
import { Check, ChevronDown, Zap, Brain, Eye, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { MODEL_INFO, type OpenRouterModel } from "@/lib/openrouter"

interface ModelSelectorProps {
  selectedModel: OpenRouterModel
  onModelChange: (model: OpenRouterModel) => void
  disabled?: boolean
}

const getProviderIcon = (provider: string) => {
  switch (provider.toLowerCase()) {
    case "openai":
      return "🤖"
    case "anthropic":
      return "🧠"
    case "google":
      return "🔍"
    case "meta":
      return "🦙"
    case "mistral ai":
      return "🌪️"
    default:
      return "⚡"
  }
}

const getCapabilityIcon = (capability: string) => {
  switch (capability) {
    case "vision":
      return <Eye className="w-3 h-3" />
    case "function-calling":
      return <Zap className="w-3 h-3" />
    case "analysis":
      return <Brain className="w-3 h-3" />
    case "multilingual":
      return <Globe className="w-3 h-3" />
    default:
      return null
  }
}

export function ModelSelector({ selectedModel, onModelChange, disabled }: ModelSelectorProps) {
  const [open, setOpen] = useState(false)
  const selectedInfo = MODEL_INFO[selectedModel]

  const groupedModels = Object.entries(MODEL_INFO).reduce(
    (acc, [key, info]) => {
      const provider = info.provider
      if (!acc[provider]) {
        acc[provider] = []
      }
      acc[provider].push({ key: key as OpenRouterModel, info })
      return acc
    },
    {} as Record<string, Array<{ key: OpenRouterModel; info: (typeof MODEL_INFO)[OpenRouterModel] }>>,
  )

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className="flex items-center gap-2 min-w-[200px] justify-between bg-white dark:bg-[#2f2f2f] border-gray-300 dark:border-gray-600"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm">{getProviderIcon(selectedInfo.provider)}</span>
            <span className="font-medium">{selectedInfo.name}</span>
          </div>
          <ChevronDown className="w-4 h-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80">
        <DropdownMenuLabel>Select AI Model</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {Object.entries(groupedModels).map(([provider, models]) => (
          <div key={provider}>
            <DropdownMenuLabel className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1">
              {getProviderIcon(provider)} {provider}
            </DropdownMenuLabel>
            {models.map(({ key, info }) => (
              <DropdownMenuItem
                key={key}
                onClick={() => {
                  onModelChange(key)
                  setOpen(false)
                }}
                className="flex items-start gap-3 p-3 cursor-pointer"
              >
                <div className="flex items-center justify-center w-5 h-5 mt-0.5">
                  {selectedModel === key && <Check className="w-4 h-4 text-blue-600" />}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{info.name}</span>
                    <div className="flex gap-1">
                      {info.capabilities.map((cap) => (
                        <div key={cap} className="text-gray-400" title={cap}>
                          {getCapabilityIcon(cap)}
                        </div>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{info.description}</p>
                  <div className="flex items-center gap-2 text-xs">
                    <Badge variant="secondary" className="text-xs">
                      {info.contextLength.toLocaleString()} tokens
                    </Badge>
                    <span className="text-gray-400">
                      ${info.pricing.input}/1K in • ${info.pricing.output}/1K out
                    </span>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
