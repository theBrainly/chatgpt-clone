"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { SettingsDialog } from "@/components/settings/SettingsDialog"

export function UserProfileMenu() {
  const { data: session } = useSession()
  const router = useRouter()
  const [settingsOpen, setSettingsOpen] = useState(false)

  const handleSettings = () => {
    setSettingsOpen(true)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Avatar>
          <AvatarImage src={session?.user?.image || ""} />
          <AvatarFallback>{session?.user?.name?.slice(0, 2).toUpperCase() || "UN"}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuItem onClick={() => router.push("/profile")}>Profile</DropdownMenuItem>
        <DropdownMenuItem onClick={handleSettings}>Settings</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()}>Logout</DropdownMenuItem>
        <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
