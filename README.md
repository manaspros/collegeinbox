# Collegiate Inbox Navigator 🎓

An AI-powered academic assistant that helps college students manage their emails, assignments, deadlines, and course materials through a natural language interface powered by **Google Gemini 2.0 Flash** and **Composio**.

## 🎯 Overview

This is a self-operating academic assistant with a natural-language chat bar. Students can type commands like:
- "Show me deadlines this week"
- "Find PDFs from Machine Learning"
- "What assignments are due this weekend?"

The AI agent uses Composio tools to pull data from Gmail, Google Classroom, Google Drive, and Calendar, with one-click sync capabilities.

## ✨ Features

### 🎯 Core Features
- ✅ **Natural Language Chat Interface**: Powered by Gemini 2.0 Flash with function calling
- ✅ **Gmail Integration**: Read, search, and manage university emails
- ✅ **Google Classroom Integration**: Access courses, assignments, and materials
- ✅ **Google Calendar Integration**: View and sync deadlines automatically
- ✅ **Google Drive Integration**: Search and access course files
- ✅ **Smart Email Categorization**: AI automatically categorizes emails by course
- ✅ **Critical Path Dashboard**: Organized view of Deadlines, Documents, and Alerts
- ✅ **Deadline Tracking**: Countdown timers with color-coded urgency
- ✅ **Document Repository**: Filter by course with course tagging
- ✅ **Schedule Alerts**: Real-time notifications for cancellations, reschedules

### 🚀 Advanced Features
- 📊 **Analytics Dashboard**: Recharts visualizations
  - Emails per week (line chart)
  - Deadlines per month (bar chart)
  - Course distribution (pie chart)
- 🗓️ **Calendar Heatmap**: GitHub-style activity visualization
- 🎤 **Voice Assistant**: Web Speech API for voice commands
- ⏰ **8 AM Daily Routine**: Automated morning digest via email
- 🔍 **Semantic Search**: Pinecone + Gemini embeddings for NLP file search
- 🔔 **Web Push Notifications**: Browser notifications for critical updates
- 📧 **Email Summarization**: 3-sentence summaries for long emails
- 🏷️ **Auto Course Tagging**: Heuristic + AI-powered course detection

## 🛠️ Tech Stack

### Frontend & Backend
- **Next.js 16** (App Router) with React 19
- **TypeScript** for type safety
- **Material-UI v7** for beautiful UI components
- **Tailwind CSS** for utility styling

### AI & Integrations
- **Google Gemini 2.0 Flash** for AI agent with function calling
- **Composio** for OAuth management and 250+ tool integrations
- **Vercel AI SDK** for streaming chat responses

### Database & Auth
- **Firebase Firestore** for document storage and caching
- **Firebase Authentication** (Google + Email/Password)

### Analytics & Visualization
- **Recharts** for analytics charts
- **react-calendar-heatmap** for GitHub-style heatmap
- **date-fns** for date manipulation

### Advanced Features
- **Pinecone** for vector search and semantic file search
- **Web Speech API** for voice commands
- **web-push** for browser notifications
- **node-cron / Vercel Cron** for scheduled tasks

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
```bash
cp .env.local.example .env.local
```

Fill in your API keys in `.env.local`:
```env
# Required
COMPOSIO_API_KEY=your_composio_key
GEMINI_API_KEY=your_gemini_key
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional (for advanced features)
PINECONE_API_KEY=your_pinecone_key
PINECONE_ENVIRONMENT=your_env
PINECONE_INDEX=collegiate-inbox
VAPID_PUBLIC_KEY=your_vapid_public
VAPID_PRIVATE_KEY=your_vapid_private
CRON_SECRET=your_cron_secret
```

### 3. Get API Keys

#### Composio (Required)
1. Go to [Composio Dashboard](https://app.composio.dev)
2. Sign up and navigate to Settings
3. Copy your API Key

#### Google Gemini (Required)
1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Click "Create API Key"
3. Copy the generated key

#### Firebase (Required)
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable Authentication (Google + Email/Password)
4. Enable Firestore Database (test mode)
5. Copy config from Project Settings

#### Pinecone (Optional - for semantic search)
1. Go to [Pinecone](https://www.pinecone.io/)
2. Sign up and create an index named `collegiate-inbox`
3. Copy API key and environment

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📖 Usage Guide

### Getting Started
1. **Sign In**: Use Google or Email/Password
2. **Connect Apps**: Go to `/integrations` and connect:
   - Gmail
   - Google Classroom
   - Google Calendar
   - Google Drive
3. **Start Chatting**: Ask the AI assistant anything!

### Example Commands
```
"Show me all deadlines this week"
"Find PDFs from my Machine Learning course"
"What assignments are due this weekend?"
"Unread emails from professors last 7 days"
"Download latest lecture slides for DS-204"
"Create a 2-hour study block tomorrow at 6 PM"
"Summarize the last 5 important emails"
```

### Dashboard Navigation
- **AI Assistant Tab**: Natural language chat interface
- **Deadlines Tab**: View all upcoming deadlines with countdown
- **Documents Tab**: Browse and filter course documents
- **Alerts Tab**: Schedule changes and urgent notifications
- **Voice Assistant Tab**: Use voice commands

### Analytics Page
Visit `/analytics` to see:
- Email activity trends
- Deadline distribution by month
- Course workload breakdown
- Activity heatmap

## 🏗️ Architecture

```
User Query
    ↓
Gemini 2.0 Flash (AI Agent)
    ↓
Function Calling → Composio Tools
    ↓
Google APIs (Gmail, Classroom, Calendar, Drive)
    ↓
Formatted Response + Cache in Firestore
```

### Key Components
- **`lib/composio.ts`**: Composio client and entity management
- **`lib/gemini.ts`**: Gemini model and AI utilities
- **`lib/firebase.ts`**: Firebase initialization
- **`lib/pinecone.ts`**: Vector search for semantic file search
- **`app/api/chat/route.ts`**: AI chat endpoint with streaming
- **`app/api/deadlines/route.ts`**: Aggregate deadlines from multiple sources
- **`app/api/cron/daily/route.ts`**: Daily 8 AM routine

## 📅 Automated Daily Routine

Every morning at 8 AM, the system:
1. Clears old caches
2. Fetches fresh data from Gmail, Classroom, and Calendar
3. Generates a personalized digest with:
   - Upcoming deadlines (next 7 days)
   - Schedule alerts
   - Important notifications
4. Sends digest via email (optionally WhatsApp/Slack)

To set up on Vercel:
```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/daily?userId=USER_ID",
      "schedule": "0 8 * * *"
    }
  ]
}
```

## 🔔 Push Notifications

Enable browser notifications to receive real-time alerts for:
- Cancelled classes
- Rescheduled events
- Room changes
- Urgent announcements

The app uses Web Push API with VAPID keys.

## 🎤 Voice Commands

Activate voice assistant in the dashboard:
1. Click the microphone icon
2. Say commands like:
   - "What's due today?"
   - "Show my deadlines"
   - "Check my emails"
   - "Find documents"
3. The AI will respond with voice feedback

## 📊 Firestore Schema

```
users/{uid}
  - email, displayName, createdAt

cache_deadlines/{uid}/items/{autoId}
  - title, course, dueAt, source, url, type, createdAt

cache_documents/{uid}/files/{autoId}
  - name, course, mime, driveFileId, emailId, url, createdAt

cache_alerts/{uid}/items/{autoId}
  - kind, subject, date, link, course

push_subscriptions/{uid}
  - subscription, createdAt
```

## 🚢 Deployment

### Deploy to Vercel
```bash
npm install -g vercel
vercel
```

Then:
1. Add environment variables in Vercel Dashboard
2. Set up Cron jobs for daily routine
3. Configure custom domain (optional)

### Environment Variables on Vercel
Add all variables from `.env.local` to Vercel → Settings → Environment Variables

## 🧪 Testing

Test the complete flow:
1. Sign in with Google
2. Connect all integrations
3. Test chat with: "Show me deadlines this week"
4. Check Deadlines tab for data
5. Visit Analytics page
6. Try voice commands
7. Test push notifications (if configured)

## 🎯 Success Metrics

✅ OAuth connect flow < 2 minutes
✅ Agent tool calls succeed > 90%
✅ Dashboard TTFB < 2s (with cache)
✅ Voice commands accuracy > 85%
✅ 8 AM routine fires daily with < 1% failures
✅ Judges can add event to Calendar in ≤ 2 clicks

## 💰 Cost Estimate (100 active students)

- **Composio Pro**: ~$29/mo (≈10k requests)
- **Gemini API**: ~$10–15/mo (prompt-light)
- **Firebase**: ~$5–10/mo (Firestore + Auth)
- **Pinecone**: Free tier sufficient for POC
- **Vercel**: Free tier

**Total**: ~$45–55/month

## 🤝 Contributing

This project was built for a hackathon challenge. Contributions are welcome!

## 📄 License

MIT License

## 🙏 Acknowledgments

Built with:
- [Composio](https://composio.dev) for seamless integrations
- [Google Gemini](https://ai.google.dev/gemini-api) for AI capabilities
- [Firebase](https://firebase.google.com) for backend infrastructure

---

**Built for Hackathon Challenge 5 with ❤️**

Ready to revolutionize academic productivity! 🚀
