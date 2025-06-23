"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Settings,
  Download,
  Trash2,
  Sun,
  Moon,
  Monitor,
  Bell,
  Shield,
  Key,
  Globe,
  Eye,
  AlertTriangle,
} from "lucide-react"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()

  const [settings, setSettings] = useState({
    // General
    name: session?.user?.name || "",
    email: session?.user?.email || "",
    language: "en",
    timezone: "UTC",

    // Notifications
    pushNotifications: true,
    emailNotifications: false,
    desktopNotifications: true,
    soundEnabled: true,

    // Privacy
    dataCollection: false,
    analyticsOptOut: true,
    shareUsageData: false,
    publicProfile: false,

    // Chat
    autoSave: true,
    messageHistory: true,
    showTypingIndicator: true,
    readReceipts: true,

    // Security
    twoFactorEnabled: false,
    sessionTimeout: 30,
    loginAlerts: true,
  })

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (session?.user) {
      setSettings((prev) => ({
        ...prev,
        name: session.user.name || "",
        email: session.user.email || "",
      }))
    }
  }, [session])

  const handleSave = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/user/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        toast({
          title: "Settings saved",
          description: "Your settings have been updated successfully.",
        })
        onOpenChange(false)
      } else {
        throw new Error("Failed to save settings")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleExportData = async () => {
    try {
      const response = await fetch("/api/user/export")
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `chatgpt-data-${new Date().toISOString().split("T")[0]}.json`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast({
          title: "Data exported",
          description: "Your data has been exported successfully.",
        })
      }
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteAccount = () => {
    toast({
      title: "Account deletion",
      description: "Please contact support to delete your account.",
      variant: "destructive",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Settings
          </DialogTitle>
          <DialogDescription>Manage your account settings and preferences.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  General Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Display Name</Label>
                    <Input
                      id="name"
                      value={settings.name}
                      onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                      placeholder="Enter your display name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={settings.email}
                      onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select
                      value={settings.language}
                      onValueChange={(value) => setSettings({ ...settings, language: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                        <SelectItem value="zh">Chinese</SelectItem>
                        <SelectItem value="ja">Japanese</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select
                      value={settings.timezone}
                      onValueChange={(value) => setSettings({ ...settings, timezone: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="America/New_York">Eastern Time</SelectItem>
                        <SelectItem value="America/Chicago">Central Time</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                        <SelectItem value="Europe/London">London</SelectItem>
                        <SelectItem value="Europe/Paris">Paris</SelectItem>
                        <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Chat Preferences</h4>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto-save conversations</Label>
                      <p className="text-sm text-gray-500">Automatically save your chat conversations</p>
                    </div>
                    <Switch
                      checked={settings.autoSave}
                      onCheckedChange={(checked) => setSettings({ ...settings, autoSave: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Message history</Label>
                      <p className="text-sm text-gray-500">Keep a history of your messages</p>
                    </div>
                    <Switch
                      checked={settings.messageHistory}
                      onCheckedChange={(checked) => setSettings({ ...settings, messageHistory: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Typing indicator</Label>
                      <p className="text-sm text-gray-500">Show when you're typing in shared chats</p>
                    </div>
                    <Switch
                      checked={settings.showTypingIndicator}
                      onCheckedChange={(checked) => setSettings({ ...settings, showTypingIndicator: checked })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Appearance Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Label>Theme</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={theme === "light" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTheme("light")}
                      className="flex items-center gap-2"
                    >
                      <Sun className="w-4 h-4" />
                      Light
                    </Button>
                    <Button
                      variant={theme === "dark" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTheme("dark")}
                      className="flex items-center gap-2"
                    >
                      <Moon className="w-4 h-4" />
                      Dark
                    </Button>
                    <Button
                      variant={theme === "system" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTheme("system")}
                      className="flex items-center gap-2"
                    >
                      <Monitor className="w-4 h-4" />
                      System
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Display Options</h4>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Compact mode</Label>
                      <p className="text-sm text-gray-500">Use a more compact interface</p>
                    </div>
                    <Switch />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Show timestamps</Label>
                      <p className="text-sm text-gray-500">Display message timestamps</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Animated UI</Label>
                      <p className="text-sm text-gray-500">Enable interface animations</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  Notification Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Push notifications</Label>
                    <p className="text-sm text-gray-500">Receive push notifications</p>
                  </div>
                  <Switch
                    checked={settings.pushNotifications}
                    onCheckedChange={(checked) => setSettings({ ...settings, pushNotifications: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email notifications</Label>
                    <p className="text-sm text-gray-500">Receive email notifications</p>
                  </div>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Desktop notifications</Label>
                    <p className="text-sm text-gray-500">Show desktop notifications</p>
                  </div>
                  <Switch
                    checked={settings.desktopNotifications}
                    onCheckedChange={(checked) => setSettings({ ...settings, desktopNotifications: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Sound notifications</Label>
                    <p className="text-sm text-gray-500">Play sound for notifications</p>
                  </div>
                  <Switch
                    checked={settings.soundEnabled}
                    onCheckedChange={(checked) => setSettings({ ...settings, soundEnabled: checked })}
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Notification Types</h4>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">New messages</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Chat invitations</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">System updates</span>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Marketing emails</span>
                      <Switch />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="privacy" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Privacy Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Data collection</Label>
                    <p className="text-sm text-gray-500">Allow anonymous usage data collection</p>
                  </div>
                  <Switch
                    checked={settings.dataCollection}
                    onCheckedChange={(checked) => setSettings({ ...settings, dataCollection: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Analytics opt-out</Label>
                    <p className="text-sm text-gray-500">Opt out of analytics tracking</p>
                  </div>
                  <Switch
                    checked={settings.analyticsOptOut}
                    onCheckedChange={(checked) => setSettings({ ...settings, analyticsOptOut: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Share usage data</Label>
                    <p className="text-sm text-gray-500">Help improve the service by sharing usage data</p>
                  </div>
                  <Switch
                    checked={settings.shareUsageData}
                    onCheckedChange={(checked) => setSettings({ ...settings, shareUsageData: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Public profile</Label>
                    <p className="text-sm text-gray-500">Make your profile visible to other users</p>
                  </div>
                  <Switch
                    checked={settings.publicProfile}
                    onCheckedChange={(checked) => setSettings({ ...settings, publicProfile: checked })}
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Data Management</Label>
                  <div className="space-y-2">
                    <Button variant="outline" onClick={handleExportData} className="w-full justify-start gap-2">
                      <Download className="w-4 h-4" />
                      Export my data
                    </Button>
                    <p className="text-xs text-gray-500">
                      Download a copy of your data including chats, settings, and profile information.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Security Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Two-factor authentication</Label>
                    <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                  </div>
                  <Switch
                    checked={settings.twoFactorEnabled}
                    onCheckedChange={(checked) => setSettings({ ...settings, twoFactorEnabled: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Login alerts</Label>
                    <p className="text-sm text-gray-500">Get notified of new login attempts</p>
                  </div>
                  <Switch
                    checked={settings.loginAlerts}
                    onCheckedChange={(checked) => setSettings({ ...settings, loginAlerts: checked })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Session timeout (minutes)</Label>
                  <Select
                    value={settings.sessionTimeout.toString()}
                    onValueChange={(value) => setSettings({ ...settings, sessionTimeout: Number.parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                      <SelectItem value="480">8 hours</SelectItem>
                      <SelectItem value="0">Never</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-red-600 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Danger Zone
                  </Label>
                  <div className="space-y-2">
                    <Button variant="destructive" onClick={handleDeleteAccount} className="w-full justify-start gap-2">
                      <Trash2 className="w-4 h-4" />
                      Delete my account
                    </Button>
                    <p className="text-sm text-gray-500">
                      This action cannot be undone. This will permanently delete your account and remove your data.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
