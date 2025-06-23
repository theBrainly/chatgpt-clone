# ChatGPT Clone - Full Stack Application with Real-time Collaboration

A pixel-perfect clone of ChatGPT built with Next.js, React, Tailwind CSS, MongoDB, and the Vercel AI SDK, featuring real-time collaboration capabilities.

## ✨ Features

- **Pixel-perfect ChatGPT UI/UX** - Matches the original layout, spacing, fonts, and animations
- **User Authentication** - Secure sign-in/sign-up with NextAuth.js
- **Real-time Collaboration** - Multiple users can collaborate in shared chat sessions
- **Cross-Device Sync** - Chats persist across different devices and login sessions
- **Multiple Auth Providers** - Email/password, Google, and GitHub authentication
- **Fully Responsive Design** - Works seamlessly on desktop, tablet, and mobile devices
- **Real-time Streaming Responses** - AI messages stream in real-time with smooth UI updates
- **Message Editing** - Edit previous messages and regenerate AI responses
- **File Upload Support** - Upload images and documents with Cloudinary integration
- **Memory Persistence** - User-specific memory across chat sessions
- **Context Window Management** - Intelligent handling of long conversations
- **Chat History** - Persistent chat storage with MongoDB linked to user accounts
- **Protected Routes** - Middleware-based route protection
- **Accessibility** - ARIA compliant and keyboard navigation support

## 🤝 Real-time Collaboration Features

### **Shared Chat Sessions**
- **Multi-user Access**: Multiple users can participate in the same chat conversation
- **Real-time Synchronization**: Messages appear instantly for all participants
- **Role-based Permissions**: Owner, Editor, and Viewer roles with different capabilities
- **Active User Indicators**: See who's currently online and participating

### **Collaboration Management**
- **Invite System**: Send email invitations to collaborate on chats
- **Share Links**: Generate shareable links with customizable permissions
- **Access Control**: Fine-grained control over who can view, edit, or invite others
- **Expiring Invites**: Set expiration dates for shared access

### **Real-time Features**
- **Typing Indicators**: See when other users are typing
- **Live Presence**: Real-time display of active collaborators
- **Instant Updates**: Messages sync immediately across all participants
- **Conflict Resolution**: Graceful handling of simultaneous edits

### **Permission Levels**
- **Owner**: Full control - can manage sharing, invite users, and delete chat
- **Editor**: Can send messages, edit content, and invite others (if allowed)
- **Viewer**: Read-only access to view the conversation

## 🛠️ Tech Stack

- **Frontend**: React 18, Next.js 14 (App Router), Tailwind CSS
- **Authentication**: NextAuth.js with multiple providers
- **Backend**: Next.js API Routes, Server Actions
- **AI**: Vercel AI SDK, OpenAI GPT-4-turbo
- **Database**: MongoDB with optimized indexes for collaboration
- **File Storage**: Cloudinary
- **Real-time**: Polling-based activity tracking
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **Deployment**: Vercel

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- MongoDB database (local or MongoDB Atlas)
- OpenAI API key
- Cloudinary account
- OAuth provider credentials (optional)

### Installation

1. **Clone the repository**
   \`\`\`bash
   git clone <repository-url>
   cd chatgpt-clone
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   \`\`\`

3. **Set up environment variables**
   \`\`\`bash
   cp .env.example .env.local
   \`\`\`
   
   Fill in your environment variables:
   - `MONGODB_URI`: Your MongoDB connection string
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `CLOUDINARY_CLOUD_NAME`: Your Cloudinary cloud name
   - `CLOUDINARY_API_KEY`: Your Cloudinary API key
   - `CLOUDINARY_API_SECRET`: Your Cloudinary API secret
   - `NEXTAUTH_URL`: Your application URL (http://localhost:3000 for development)
   - `NEXTAUTH_SECRET`: A random secret for NextAuth.js
   - OAuth credentials (optional):
     - `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`
     - `GITHUB_ID` & `GITHUB_SECRET`

4. **Run the development server**
   \`\`\`bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   \`\`\`

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🤝 Using Collaboration Features

### **Sharing a Chat**
1. Open any chat conversation
2. Click the "Share" button in the chat header
3. Configure sharing settings:
   - **Public access**: Anyone with link can view
   - **Allow editing**: Collaborators can send messages
   - **Allow invites**: Collaborators can invite others
   - **Expiration**: Set when access expires
4. Generate and copy the share link

### **Inviting Collaborators**
1. In the share dialog, enter email addresses
2. Select role (Editor or Viewer)
3. Send invitations
4. Invitees receive email with acceptance link

### **Accepting Invitations**
1. Click the invitation link received via email
2. Sign in if not already authenticated
3. Accept or decline the invitation
4. Start collaborating immediately

### **Managing Collaborators**
- View all current collaborators and their roles
- Remove collaborators (owners only)
- See who's currently online and active
- Monitor typing indicators in real-time

## 💾 Database Schema

### Enhanced Chat Collection
\`\`\`javascript
{
  id: "chat_1234567890_abcdef123",
  title: "Collaborative AI Discussion",
  messages: [
    {
      id: "msg_1234567890_abcdef123",
      role: "user",
      content: "Let's discuss AI together",
      timestamp: "2024-01-01T12:00:00.000Z",
      authorId: "user_1234567890_abcdef123",
      authorName: "John Doe",
      attachments: []
    }
  ],
  userId: "user_1234567890_abcdef123", // Original creator
  collaborators: [
    {
      userId: "user_0987654321_fedcba321",
      name: "Jane Smith",
      email: "jane@example.com",
      role: "editor",
      joinedAt: "2024-01-01T12:05:00.000Z",
      lastActive: "2024-01-01T12:30:00.000Z",
      isOnline: true
    }
  ],
  isShared: true,
  shareSettings: {
    isPublic: false,
    allowEditing: true,
    allowInvites: true,
    shareLink: "https://app.com/shared/chat_123/abc123",
    expiresAt: "2024-02-01T00:00:00.000Z"
  },
  createdAt: "2024-01-01T12:00:00.000Z",
  updatedAt: "2024-01-01T12:30:00.000Z"
}
\`\`\`

### Chat Invites Collection
\`\`\`javascript
{
  id: "invite_1234567890_abcdef123",
  chatId: "chat_1234567890_abcdef123",
  inviterId: "user_1234567890_abcdef123",
  inviterName: "John Doe",
  inviteeEmail: "collaborator@example.com",
  role: "editor",
  status: "pending", // pending, accepted, declined, expired
  createdAt: "2024-01-01T12:00:00.000Z",
  expiresAt: "2024-01-08T12:00:00.000Z"
}
\`\`\`

### Chat Activity Collection
\`\`\`javascript
{
  chatId: "chat_1234567890_abcdef123",
  userId: "user_1234567890_abcdef123",
  name: "John Doe",
  avatar: "https://avatar.url",
  lastSeen: "2024-01-01T12:30:00.000Z",
  isTyping: false
}
\`\`\`

## 🔧 API Endpoints

### Collaboration APIs
- `POST /api/chats/[chatId]/share` - Share a chat with custom settings
- `DELETE /api/chats/[chatId]/share` - Disable chat sharing
- `GET /api/chats/[chatId]/collaborators` - Get chat collaborators
- `POST /api/chats/[chatId]/collaborators` - Invite new collaborator
- `DELETE /api/chats/[chatId]/collaborators` - Remove collaborator
- `GET /api/invites/[inviteId]` - Get invitation details
- `POST /api/invites/[inviteId]` - Accept/decline invitation
- `GET /api/chats/[chatId]/activity` - Get active users
- `POST /api/chats/[chatId]/activity` - Update user activity

## 🔒 Security & Privacy

### **Access Control**
- **User Isolation**: Users can only access chats they own or are invited to
- **Role-based Permissions**: Different capabilities based on user role
- **Secure Invitations**: Time-limited invites with email verification
- **Share Link Security**: Unique, non-guessable share URLs

### **Data Protection**
- **Encrypted Communication**: All data encrypted in transit
- **Session Validation**: All operations validate user authentication
- **Audit Trail**: Track all collaboration activities
- **Privacy Controls**: Users control who can access their chats

## 📁 Project Structure

\`\`\`
├── app/
│   ├── api/
│   │   ├── chats/
│   │   │   └── [chatId]/
│   │   │       ├── share/          # Chat sharing endpoints
│   │   │       ├── collaborators/  # Collaborator management
│   │   │       └── activity/       # Real-time activity tracking
│   │   └── invites/
│   │       └── [inviteId]/         # Invitation management
│   ├── invite/
│   │   └── [inviteId]/             # Invitation acceptance page
│   └── shared/                     # Public shared chat access
├── components/
│   ├── collaboration/
│   │   ├── ShareChatDialog.tsx     # Chat sharing interface
│   │   └── ActiveUsers.tsx         # Real-time user presence
│   └── chat/
│       ├── ChatInterface.tsx       # Enhanced with collaboration
│       ├── ChatHeader.tsx          # Shows active users
│       └── ChatMessage.tsx         # Shows message authors
├── hooks/
│   └── useCollaboration.ts         # Collaboration state management
└── types/
    └── index.ts                    # Enhanced with collaboration types
\`\`\`

## 🚀 Deployment

### Deploy to Vercel

1. **Push to GitHub**
   \`\`\`bash
   git add .
   git commit -m "Add real-time collaboration features"
   git push origin main
   \`\`\`

2. **Deploy on Vercel**
   - Connect your GitHub repository to Vercel
   - Add all environment variables
   - Update `NEXTAUTH_URL` to your production domain
   - Deploy!

### Production Considerations
- **Database Scaling**: Use MongoDB Atlas with appropriate cluster size
- **Real-time Optimization**: Consider WebSocket implementation for better real-time performance
- **Email Service**: Integrate email service for invitation notifications
- **Monitoring**: Implement collaboration analytics and monitoring
- **Rate Limiting**: Add rate limiting for invitation and sharing endpoints

## 🔍 Troubleshooting

### Common Collaboration Issues

**Invitations not working:**
- Verify email addresses are correct
- Check invitation expiration dates
- Ensure users have accounts in the system

**Real-time updates not syncing:**
- Check network connectivity
- Verify polling intervals are appropriate
- Ensure proper error handling for failed requests

**Permission issues:**
- Verify user roles and permissions
- Check chat ownership and collaborator status
- Ensure proper access control validation

The collaboration system enables seamless teamwork on AI conversations, making it perfect for teams, educational settings, and collaborative research projects!
