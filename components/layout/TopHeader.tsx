"use client"

import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, Crown, Sun, Moon, Monitor, Settings, LogOut, User } from "lucide-react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { SettingsDialog } from "@/components/settings/SettingsDialog"

interface TopHeaderProps {
  title?: string
}

export function TopHeader({ title = "ChatGPT" }: TopHeaderProps) {
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const [settingsOpen, setSettingsOpen] = useState(false)

  const handleSignOut = () => {
    signOut({ callbackUrl: "/auth/signin" })
  }

  const handleProfile = () => {
    router.push("/profile")
  }

  return (
    <div className="flex items-center justify-between h-14 px-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-[#212121] flex-shrink-0">
      {/* Left side - ChatGPT Title */}
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="font-semibold text-lg text-gray-900 dark:text-white">
              {title}
              <ChevronDown className="w-4 h-4 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem>
              <span className="font-medium">ChatGPT</span>
            </DropdownMenuItem>
            <DropdownMenuItem disabled>
              <span className="text-gray-500">GPT-4</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-2">
        {/* Get Plus Button */}
        <Button
          size="sm"
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium px-4"
        >
          <Crown className="w-4 h-4 mr-2" />
          Get Plus
        </Button>

        {/* Theme Toggle */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="w-9 h-9 p-0">
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme("light")}>
              <Sun className="mr-2 h-4 w-4" />
              <span>Light</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              <Moon className="mr-2 h-4 w-4" />
              <span>Dark</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              <Monitor className="mr-2 h-4 w-4" />
              <span>System</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Avatar with Dropdown */}
        {session?.user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-8 h-8 p-0 rounded-full">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={session.user.image || undefined} />
                  <AvatarFallback className="bg-purple-600 text-white text-sm font-medium">
                    {session.user.name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{session.user.name || "User"}</p>
                <p className="text-xs text-gray-500 truncate">{session.user.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleProfile} className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSettingsOpen(true)} className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600 focus:text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  )
}
