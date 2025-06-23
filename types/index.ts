export interface Message {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: Date
  isEditing?: boolean
  attachments?: Attachment[]
  isStreaming?: boolean
  authorId?: string // Who sent this message
  authorName?: string // Display name of the author
}

export interface Attachment {
  id: string
  type: "image" | "document"
  url: string
  name: string
  size: number
  mimeType: string
}

export interface Chat {
  id: string
  title: string
  messages: Message[]
  userId: string // Original creator
  collaborators: Collaborator[]
  isShared: boolean
  shareSettings: ShareSettings
  createdAt: Date
  updatedAt: Date
}

export interface Collaborator {
  userId: string
  name: string
  email: string
  avatar?: string
  role: "owner" | "editor" | "viewer"
  joinedAt: Date
  lastActive?: Date
  isOnline?: boolean
}

export interface ShareSettings {
  isPublic: boolean
  allowEditing: boolean
  allowInvites: boolean
  expiresAt?: Date
  shareLink?: string
}

export interface ChatInvite {
  id: string
  chatId: string
  inviterId: string
  inviterName: string
  inviteeEmail: string
  role: "editor" | "viewer"
  status: "pending" | "accepted" | "declined" | "expired"
  createdAt: Date
  expiresAt: Date
}

export interface User {
  id: string
  email: string
  name: string
  password?: string
  avatar?: string
  bio?: string
  location?: string
  website?: string
  phone?: string
  dateOfBirth?: Date
  gender?: "male" | "female" | "other" | "prefer-not-to-say"
  timezone?: string
  language?: string
  provider?: string
  emailVerified?: boolean
  phoneVerified?: boolean
  twoFactorEnabled?: boolean
  plan?: "free" | "plus" | "premium"
  planExpiresAt?: Date
  preferences?: UserPreferences
  stats?: UserStats
  activity?: UserActivity
  createdAt: Date
  updatedAt: Date
  lastLoginAt?: Date
  lastActiveAt?: Date
}

export interface UserPreferences {
  theme?: "light" | "dark" | "system"
  language?: string
  timezone?: string
  notifications?: NotificationSettings
  privacy?: PrivacySettings
  chat?: ChatSettings
  accessibility?: AccessibilitySettings
}

export interface NotificationSettings {
  email?: boolean
  push?: boolean
  desktop?: boolean
  sound?: boolean
  newMessages?: boolean
  chatInvitations?: boolean
  systemUpdates?: boolean
  marketing?: boolean
}

export interface PrivacySettings {
  profileVisibility?: "public" | "private" | "friends"
  showOnlineStatus?: boolean
  allowDataCollection?: boolean
  shareUsageData?: boolean
  analyticsOptOut?: boolean
}

export interface ChatSettings {
  autoSave?: boolean
  messageHistory?: boolean
  showTypingIndicator?: boolean
  readReceipts?: boolean
  enterToSend?: boolean
  soundNotifications?: boolean
}

export interface AccessibilitySettings {
  fontSize?: "small" | "medium" | "large"
  highContrast?: boolean
  reducedMotion?: boolean
  screenReader?: boolean
}

export interface UserStats {
  totalChats: number
  totalMessages: number
  totalCollaborations: number
  totalSharedChats: number
  averageMessagesPerChat: number
  longestChatSession: number
  favoriteTimeOfDay: string
  mostActiveDay: string
  totalTimeSpent: number // in minutes
  lastCalculatedAt: Date
}

export interface UserActivity {
  lastLoginAt?: Date
  lastActiveAt?: Date
  currentSessionStart?: Date
  totalSessions: number
  averageSessionDuration: number // in minutes
  loginStreak: number
  longestLoginStreak: number
  deviceInfo?: DeviceInfo[]
  ipHistory?: IPHistory[]
}

export interface DeviceInfo {
  id: string
  name: string
  type: "desktop" | "mobile" | "tablet"
  browser: string
  os: string
  lastUsed: Date
  isActive: boolean
}

export interface IPHistory {
  ip: string
  location?: string
  firstSeen: Date
  lastSeen: Date
  loginCount: number
}

export interface Memory {
  id: string
  userId: string
  key: string
  value: string
  context: string
  createdAt: Date
  updatedAt: Date
}

export interface ChatContextWindow {
  maxTokens: number
  currentTokens: number
  messages: Message[]
}

export interface ActiveUser {
  userId: string
  name: string
  avatar?: string
  lastSeen: Date
  isTyping?: boolean
  cursor?: {
    messageId: string
    position: number
  }
}

// NextAuth types extension
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }

  interface User {
    id: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
  }
}
