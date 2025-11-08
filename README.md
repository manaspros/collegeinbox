# Collegiate Inbox Navigator 🎓

An AI-powered academic assistant that helps college students manage their emails, assignments, deadlines, and course materials through a natural language interface powered by Google Gemini AI and Composio v3.

## 🎯 MVP Features (COMPLETE)

### ✅ Secure Gmail Integration
- Robust OAuth connection to college Gmail account
- Read and process emails securely
- Advanced email filtering and search
- Attachment detection and extraction

### ✅ Critical Path Dashboard
A single, clean page that summarizes all crucial information:

#### 📅 Upcoming Deadlines
- List of assignments and exams extracted from emails
- **Color-coded countdown timers**:
  - 🔴 Red: Overdue
  - 🟠 Orange: 0-2 days
  - 🟡 Yellow: 3-7 days
  - 🟢 Green: 8+ days
- Priority indicators (high/medium/low)
- Course names and descriptions
- One-click calendar sync

#### 📁 Key Document Repository
- Automatically identifies and organizes PDFs, DOCX, and PPT files
- Categorized by course name
- Filter by course using tabs
- Direct download functionality
- Smart categorization (assignments/lectures/notes/syllabus)

#### ⚠️ Schedule Changes/Alerts
- Dynamic feed of important notices
- Keyword detection: "Cancelled", "Rescheduled", "Urgent Notice", "Room Change"
- Course association
- Visual warning indicators

### ✅ Smart Categorization
- AI-powered email analysis using Gemini 2.0 Flash
- Automatic course/subject tagging
- Intelligent deadline extraction
- Document type classification

### ✅ One-Click Calendar Sync
- Instant sync to Google Calendar
- Automated reminders (1 day + 1 hour before)
- Event formatting with course and assignment details
- Success/error notifications

### Core Features ✅
- **Natural Language Chat Interface**: Ask questions like "Show me all deadlines this week"
- **Gmail Integration**: Read, search, and manage university emails
- **Google Classroom Integration**: Access courses, assignments, materials (ready)
- **Google Calendar Integration**: View and sync deadlines automatically
- **Google Drive Integration**: Search and access course files (ready)
- **Composio v3**: Latest integration platform with enhanced stability

The AI agent uses Composio tools to pull data from Gmail, Google Classroom, Google Drive, and Calendar, with one-click sync capabilities.

## ✨ Features

- **Frontend**: Next.js 16 (React 19), Material-UI v7, TypeScript
- **Backend**: Next.js API Routes, Firebase Auth & Firestore
- **AI**: Google Gemini 2.0 Flash Exp
- **Integrations**: Composio v3 (@composio/core v0.1.55)
- **Utilities**: date-fns, Recharts, Pinecone (optional), node-cron

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
User Gmail → Composio v3 → API Routes → Gemini AI Analysis → Critical Path Dashboard
                                    ↓
                            Google Calendar ← One-Click Sync
```

**Workflow**:
1. User connects Gmail via Composio v3 OAuth
2. System fetches recent emails (last 30 days)
3. Gemini AI analyzes emails for:
   - Deadlines (assignments, exams, projects)
   - Documents (PDFs, DOCX, PPT)
   - Schedule changes (cancellations, room changes)
   - Course categorization
4. Critical Path Dashboard displays organized information
5. One-click sync adds deadlines to Google Calendar

Composio v3 handles secure OAuth and provides 250+ tools. Gemini AI understands natural language and calls the right tools automatically.

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

## 📖 Documentation

- **[MVP Implementation Guide](./MVP_IMPLEMENTATION.md)** - Complete documentation of MVP features
- **[Setup Guide](./SETUP.md)** - Step-by-step installation instructions
- **[Bug Fixes](./BUGFIXES.md)** - Previous bug fixes and improvements

## 🎯 MVP Status

All required features have been implemented and tested:

- ✅ Secure Gmail Integration
- ✅ Critical Path Dashboard
  - ✅ Upcoming Deadlines with Countdown
  - ✅ Key Document Repository
  - ✅ Schedule Changes/Alerts
- ✅ Smart Categorization with AI
- ✅ One-Click Calendar Sync
- ✅ Composio v3 Integration

## 🚀 What's New in v2.0

### Composio v3 Upgrade
- Migrated from `composio-core` to `@composio/core`
- Better TypeScript support
- Enhanced stability and performance

### Critical Path Dashboard
- Brand new dashboard component
- Real-time email analysis
- Visual countdown timers
- Document organization by course
- Schedule alert monitoring

### AI-Powered Analysis
- Gemini 2.0 Flash Exp integration
- Smart deadline extraction
- Automatic course categorization
- Document type classification

### Enhanced Calendar Integration
- One-click event creation
- Automatic reminder setup
- Smart event formatting

Built for Hackathon Challenge 5 with ❤️

**Version**: 2.0.0 (MVP Complete)
**Last Updated**: November 8, 2025
