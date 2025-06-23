"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Camera, Save, Mail, Calendar, MapPin, LinkIcon, Loader2, Globe, Phone } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useUserProfile } from "@/hooks/useUserProfile"
import { useFileUpload } from "@/hooks/useFileUpload"

export default function ProfilePage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user, stats, loading, saving, updateProfile } = useUserProfile()
  const { uploadFile, uploading } = useFileUpload()

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    bio: "",
    location: "",
    website: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    timezone: "",
    language: "",
    avatar: "",
  })

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || "",
        email: user.email || "",
        bio: user.bio || "",
        location: user.location || "",
        website: user.website || "",
        phone: user.phone || "",
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split("T")[0] : "",
        gender: user.gender || "",
        timezone: user.timezone || "UTC",
        language: user.language || "en",
        avatar: user.avatar || "",
      })
    }
  }, [user])

  const handleSave = async () => {
    const updates = {
      ...profile,
      dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth) : undefined,
    }

    const success = await updateProfile(updates)
    if (success) {
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      })
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const uploadedFile = await uploadFile(file)
      setProfile({ ...profile, avatar: uploadedFile.url })

      // Auto-save avatar
      await updateProfile({ avatar: uploadedFile.url })

      toast({
        title: "Avatar uploaded",
        description: "Your profile picture has been updated.",
      })
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload avatar. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#171717]">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profile</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage your account information and preferences</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your personal details and profile information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar Section */}
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={profile.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="bg-purple-600 text-white text-2xl font-medium">
                        {profile.name.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <label className="absolute bottom-0 right-0 bg-white dark:bg-[#2f2f2f] rounded-full p-2 shadow-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-[#3f3f3f] transition-colors">
                      <Camera className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                        disabled={uploading}
                      />
                    </label>
                    {uploading && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-white" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{profile.name}</h3>
                    <p className="text-gray-600 dark:text-gray-400">{profile.email}</p>
                    <Badge variant="secondary" className="mt-2">
                      {user?.plan === "plus" ? "Plus Plan" : "Free Plan"}
                    </Badge>
                  </div>
                </div>

                <Separator />

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Display Name</Label>
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      placeholder="Enter your display name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    placeholder="Tell us about yourself..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={profile.location}
                      onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                      placeholder="City, Country"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={profile.website}
                      onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                      placeholder="https://yourwebsite.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={profile.dateOfBirth}
                      onChange={(e) => setProfile({ ...profile, dateOfBirth: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select value={profile.gender} onValueChange={(value) => setProfile({ ...profile, gender: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select
                      value={profile.timezone}
                      onValueChange={(value) => setProfile({ ...profile, timezone: value })}
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

                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select
                      value={profile.language}
                      onValueChange={(value) => setProfile({ ...profile, language: value })}
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
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stats and Info Sidebar */}
          <div className="space-y-6">
            {/* Account Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Account Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!stats ? (
                  <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-4 bg-gray-200 dark:bg-[#2f2f2f] rounded animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Total Chats</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{stats.totalChats}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Total Messages</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{stats.totalMessages}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Collaborations</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{stats.totalCollaborations}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Shared Chats</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{stats.totalSharedChats}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Member Since</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {stats.memberSince || "Recently"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Last Active</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{stats.lastActive || "Now"}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Account Info */}
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Email</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{profile.email}</p>
                  </div>
                </div>

                {profile.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Phone</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{profile.phone}</p>
                    </div>
                  </div>
                )}

                {profile.location && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Location</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{profile.location}</p>
                    </div>
                  </div>
                )}

                {profile.website && (
                  <div className="flex items-center gap-3">
                    <LinkIcon className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Website</p>
                      <a
                        href={profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {profile.website}
                      </a>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Joined</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Recently"}
                    </p>
                  </div>
                </div>

                {profile.timezone && (
                  <div className="flex items-center gap-3">
                    <Globe className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Timezone</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{profile.timezone}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upgrade Card */}
            <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-700">
              <CardContent className="p-6">
                <div className="text-center">
                  <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">Upgrade to Plus</h3>
                  <p className="text-sm text-purple-700 dark:text-purple-300 mb-4">
                    Get access to GPT-4, faster responses, and priority access to new features.
                  </p>
                  <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">Upgrade Now</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
