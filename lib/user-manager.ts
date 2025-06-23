import { getDatabase } from "./mongodb"
import type { User, UserStats, DeviceInfo } from "@/types"

export class UserManager {
  private db

  constructor() {
    this.db = getDatabase()
  }

  async createUser(userData: Partial<User>): Promise<User> {
    const database = await this.db
    const users = database.collection<User>("users")

    const newUser: User = {
      id: userData.id || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email: userData.email || "",
      name: userData.name || "",
      avatar: userData.avatar,
      bio: "",
      location: "",
      website: "",
      phone: "",
      timezone: "UTC",
      language: "en",
      provider: userData.provider || "credentials",
      emailVerified: false,
      phoneVerified: false,
      twoFactorEnabled: false,
      plan: "free",
      preferences: {
        theme: "system",
        language: "en",
        timezone: "UTC",
        notifications: {
          email: true,
          push: true,
          desktop: true,
          sound: true,
          newMessages: true,
          chatInvitations: true,
          systemUpdates: false,
          marketing: false,
        },
        privacy: {
          profileVisibility: "private",
          showOnlineStatus: true,
          allowDataCollection: false,
          shareUsageData: false,
          analyticsOptOut: true,
        },
        chat: {
          autoSave: true,
          messageHistory: true,
          showTypingIndicator: true,
          readReceipts: true,
          enterToSend: true,
          soundNotifications: true,
        },
        accessibility: {
          fontSize: "medium",
          highContrast: false,
          reducedMotion: false,
          screenReader: false,
        },
      },
      stats: {
        totalChats: 0,
        totalMessages: 0,
        totalCollaborations: 0,
        totalSharedChats: 0,
        averageMessagesPerChat: 0,
        longestChatSession: 0,
        favoriteTimeOfDay: "morning",
        mostActiveDay: "monday",
        totalTimeSpent: 0,
        lastCalculatedAt: new Date(),
      },
      activity: {
        totalSessions: 0,
        averageSessionDuration: 0,
        loginStreak: 0,
        longestLoginStreak: 0,
        deviceInfo: [],
        ipHistory: [],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      ...userData,
    }

    await users.insertOne(newUser)
    return newUser
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<boolean> {
    const database = await this.db
    const users = database.collection<User>("users")

    const result = await users.updateOne(
      { id: userId },
      {
        $set: {
          ...updates,
          updatedAt: new Date(),
        },
      },
    )

    return result.matchedCount > 0
  }

  async updateUserPreferences(userId: string, preferences: Partial<User["preferences"]>): Promise<boolean> {
    const database = await this.db
    const users = database.collection<User>("users")

    const result = await users.updateOne(
      { id: userId },
      {
        $set: {
          preferences: preferences,
          updatedAt: new Date(),
        },
      },
    )

    return result.matchedCount > 0
  }

  async updateUserStats(userId: string): Promise<UserStats | null> {
    const database = await this.db
    const users = database.collection<User>("users")
    const chats = database.collection("chats")

    // Calculate stats
    const userChats = await chats.find({ userId }).toArray()
    const totalChats = userChats.length
    const totalMessages = userChats.reduce((total, chat) => total + (chat.messages?.length || 0), 0)
    const collaboratedChats = await chats.find({ "collaborators.userId": userId }).toArray()
    const sharedChats = await chats.find({ userId, isShared: true }).toArray()

    const stats: UserStats = {
      totalChats,
      totalMessages,
      totalCollaborations: collaboratedChats.length,
      totalSharedChats: sharedChats.length,
      averageMessagesPerChat: totalChats > 0 ? Math.round(totalMessages / totalChats) : 0,
      longestChatSession: 0, // This would need session tracking
      favoriteTimeOfDay: this.calculateFavoriteTimeOfDay(userChats),
      mostActiveDay: this.calculateMostActiveDay(userChats),
      totalTimeSpent: 0, // This would need time tracking
      lastCalculatedAt: new Date(),
    }

    await users.updateOne(
      { id: userId },
      {
        $set: {
          stats,
          updatedAt: new Date(),
        },
      },
    )

    return stats
  }

  async trackUserActivity(
    userId: string,
    activityData: {
      ip?: string
      userAgent?: string
      location?: string
    },
  ): Promise<void> {
    const database = await this.db
    const users = database.collection<User>("users")

    const user = await users.findOne({ id: userId })
    if (!user) return

    const now = new Date()
    const activity = user.activity || {
      totalSessions: 0,
      averageSessionDuration: 0,
      loginStreak: 0,
      longestLoginStreak: 0,
      deviceInfo: [],
      ipHistory: [],
    }

    // Update last active
    activity.lastActiveAt = now
    if (!activity.lastLoginAt || this.isNewSession(activity.lastLoginAt, now)) {
      activity.lastLoginAt = now
      activity.currentSessionStart = now
      activity.totalSessions += 1
    }

    // Track IP history
    if (activityData.ip) {
      const existingIP = activity.ipHistory?.find((ip) => ip.ip === activityData.ip)
      if (existingIP) {
        existingIP.lastSeen = now
        existingIP.loginCount += 1
      } else {
        activity.ipHistory = activity.ipHistory || []
        activity.ipHistory.push({
          ip: activityData.ip,
          location: activityData.location,
          firstSeen: now,
          lastSeen: now,
          loginCount: 1,
        })
      }
    }

    // Track device info
    if (activityData.userAgent) {
      const deviceInfo = this.parseUserAgent(activityData.userAgent)
      const existingDevice = activity.deviceInfo?.find((d) => d.name === deviceInfo.name)
      if (existingDevice) {
        existingDevice.lastUsed = now
        existingDevice.isActive = true
      } else {
        activity.deviceInfo = activity.deviceInfo || []
        activity.deviceInfo.push({
          ...deviceInfo,
          lastUsed: now,
          isActive: true,
        })
      }
    }

    await users.updateOne(
      { id: userId },
      {
        $set: {
          activity,
          lastActiveAt: now,
          updatedAt: now,
        },
      },
    )
  }

  async getUser(userId: string): Promise<User | null> {
    const database = await this.db
    const users = database.collection<User>("users")
    return await users.findOne({ id: userId })
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const database = await this.db
    const users = database.collection<User>("users")
    return await users.findOne({ email })
  }

  private calculateFavoriteTimeOfDay(chats: any[]): string {
    const timeSlots = { morning: 0, afternoon: 0, evening: 0, night: 0 }

    chats.forEach((chat) => {
      chat.messages?.forEach((message: any) => {
        const hour = new Date(message.timestamp).getHours()
        if (hour >= 6 && hour < 12) timeSlots.morning++
        else if (hour >= 12 && hour < 18) timeSlots.afternoon++
        else if (hour >= 18 && hour < 22) timeSlots.evening++
        else timeSlots.night++
      })
    })

    return Object.entries(timeSlots).reduce((a, b) => (timeSlots[a[0]] > timeSlots[b[0]] ? a : b))[0]
  }

  private calculateMostActiveDay(chats: any[]): string {
    const days = { monday: 0, tuesday: 0, wednesday: 0, thursday: 0, friday: 0, saturday: 0, sunday: 0 }
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]

    chats.forEach((chat) => {
      chat.messages?.forEach((message: any) => {
        const dayIndex = new Date(message.timestamp).getDay()
        const dayName = dayNames[dayIndex] as keyof typeof days
        days[dayName]++
      })
    })

    return Object.entries(days).reduce((a, b) => (days[a[0]] > days[b[0]] ? a : b))[0]
  }

  private isNewSession(lastLogin: Date, now: Date): boolean {
    const timeDiff = now.getTime() - lastLogin.getTime()
    return timeDiff > 30 * 60 * 1000 // 30 minutes
  }

  private parseUserAgent(userAgent: string): DeviceInfo {
    // Simple user agent parsing - in production, use a proper library
    const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent)
    const isTablet = /iPad|Tablet/.test(userAgent)

    let browser = "Unknown"
    if (userAgent.includes("Chrome")) browser = "Chrome"
    else if (userAgent.includes("Firefox")) browser = "Firefox"
    else if (userAgent.includes("Safari")) browser = "Safari"
    else if (userAgent.includes("Edge")) browser = "Edge"

    let os = "Unknown"
    if (userAgent.includes("Windows")) os = "Windows"
    else if (userAgent.includes("Mac")) os = "macOS"
    else if (userAgent.includes("Linux")) os = "Linux"
    else if (userAgent.includes("Android")) os = "Android"
    else if (userAgent.includes("iOS")) os = "iOS"

    return {
      id: `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `${browser} on ${os}`,
      type: isTablet ? "tablet" : isMobile ? "mobile" : "desktop",
      browser,
      os,
      lastUsed: new Date(),
      isActive: true,
    }
  }
}

export const userManager = new UserManager()
