"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Share2, Copy, Mail, Trash2, Crown, Edit, Eye } from "lucide-react"
import { useCollaboration } from "@/hooks/useCollaboration"
import { useToast } from "@/hooks/use-toast"

interface ShareChatDialogProps {
  chatId: string
  chatTitle: string
  isShared?: boolean
  onShare?: (shareLink: string) => void
}

export function ShareChatDialog({ chatId, chatTitle, isShared = false, onShare }: ShareChatDialogProps) {
  const [open, setOpen] = useState(false)
  const [shareSettings, setShareSettings] = useState({
    isPublic: false,
    allowEditing: true,
    allowInvites: true,
    expiresAt: "",
  })
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<"editor" | "viewer">("viewer")
  const [shareLink, setShareLink] = useState("")
  const [loading, setLoading] = useState(false)

  const { collaborators, inviteCollaborator, removeCollaborator, fetchCollaborators } = useCollaboration({
    chatId,
    enabled: open,
  })
  const { toast } = useToast()

  const handleShare = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/chats/${chatId}/share`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(shareSettings),
      })

      if (response.ok) {
        const data = await response.json()
        setShareLink(data.shareLink)
        onShare?.(data.shareLink)
        toast({
          title: "Chat shared successfully",
          description: "Share link has been generated",
        })
      } else {
        throw new Error("Failed to share chat")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to share chat",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = async () => {
    if (shareLink) {
      await navigator.clipboard.writeText(shareLink)
      toast({
        title: "Link copied",
        description: "Share link copied to clipboard",
      })
    }
  }

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return

    const success = await inviteCollaborator(inviteEmail, inviteRole)
    if (success) {
      setInviteEmail("")
      toast({
        title: "Invitation sent",
        description: `Invited ${inviteEmail} as ${inviteRole}`,
      })
    } else {
      toast({
        title: "Error",
        description: "Failed to send invitation",
        variant: "destructive",
      })
    }
  }

  const handleRemoveCollaborator = async (collaboratorId: string) => {
    const success = await removeCollaborator(collaboratorId)
    if (success) {
      toast({
        title: "Collaborator removed",
        description: "User has been removed from the chat",
      })
    } else {
      toast({
        title: "Error",
        description: "Failed to remove collaborator",
        variant: "destructive",
      })
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Crown className="w-3 h-3" />
      case "editor":
        return <Edit className="w-3 h-3" />
      case "viewer":
        return <Eye className="w-3 h-3" />
      default:
        return null
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "owner":
        return "default"
      case "editor":
        return "secondary"
      case "viewer":
        return "outline"
      default:
        return "outline"
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Share2 className="w-4 h-4" />
          {isShared ? "Manage sharing" : "Share"}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Share "{chatTitle}"</DialogTitle>
          <DialogDescription>Collaborate with others on this chat conversation.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Share Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Share Settings</h3>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Public access</Label>
                <p className="text-sm text-gray-500">Anyone with the link can view this chat</p>
              </div>
              <Switch
                checked={shareSettings.isPublic}
                onCheckedChange={(checked) => setShareSettings({ ...shareSettings, isPublic: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Allow editing</Label>
                <p className="text-sm text-gray-500">Collaborators can send messages</p>
              </div>
              <Switch
                checked={shareSettings.allowEditing}
                onCheckedChange={(checked) => setShareSettings({ ...shareSettings, allowEditing: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Allow invites</Label>
                <p className="text-sm text-gray-500">Collaborators can invite others</p>
              </div>
              <Switch
                checked={shareSettings.allowInvites}
                onCheckedChange={(checked) => setShareSettings({ ...shareSettings, allowInvites: checked })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expires">Expires (optional)</Label>
              <Input
                id="expires"
                type="datetime-local"
                value={shareSettings.expiresAt}
                onChange={(e) => setShareSettings({ ...shareSettings, expiresAt: e.target.value })}
              />
            </div>

            <Button onClick={handleShare} disabled={loading} className="w-full">
              {loading ? "Generating..." : "Generate Share Link"}
            </Button>

            {shareLink && (
              <div className="flex gap-2">
                <Input value={shareLink} readOnly className="flex-1" />
                <Button onClick={handleCopyLink} variant="outline" size="sm">
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Invite Collaborators */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Invite Collaborators</h3>

            <div className="flex gap-2">
              <Input
                placeholder="Enter email address"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1"
              />
              <Select value={inviteRole} onValueChange={(value: "editor" | "viewer") => setInviteRole(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleInvite} disabled={!inviteEmail.trim()}>
                <Mail className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Current Collaborators */}
          {collaborators.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Collaborators ({collaborators.length})</h3>

              <div className="space-y-2">
                {collaborators.map((collaborator) => (
                  <div key={collaborator.userId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={collaborator.avatar || "/placeholder.svg"} />
                        <AvatarFallback>{collaborator.name.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{collaborator.name}</span>
                          {collaborator.isOnline && <div className="w-2 h-2 bg-green-500 rounded-full" />}
                        </div>
                        <p className="text-sm text-gray-500">{collaborator.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant={getRoleBadgeVariant(collaborator.role)} className="gap-1">
                        {getRoleIcon(collaborator.role)}
                        {collaborator.role}
                      </Badge>

                      {collaborator.role !== "owner" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveCollaborator(collaborator.userId)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
