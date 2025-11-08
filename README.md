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

### Bonus Features 🚀
- **Calendar Heatmap**: GitHub-style visualization
- **Analytics Dashboard**: Charts showing emails/week, deadlines/month
- **Faculty Filter**: View only professor emails
- **8 AM Daily Routine**: Automated morning check
- **Push Notifications**: Browser notifications for critical changes
- **NLP File Search**: Semantic search with Pinecone
- **Voice Interaction**: Speech-to-text and text-to-speech

## Tech Stack

- **Frontend**: Next.js 16 (React 19), Material-UI v7, TypeScript
- **Backend**: Next.js API Routes, Firebase Auth & Firestore
- **AI**: Google Gemini 2.0 Flash Exp
- **Integrations**: Composio v3 (@composio/core v0.1.55)
- **Utilities**: date-fns, Recharts, Pinecone (optional), node-cron

## Quick Start

```bash
npm install
cp .env.example .env.local
# Fill in your API keys in .env.local
npm run dev
```

Open http://localhost:3000

## Environment Setup

Get API keys from:
- Composio: https://app.composio.dev/settings
- Gemini: https://aistudio.google.com/apikey
- Firebase: https://console.firebase.google.com
- Pinecone (optional): https://www.pinecone.io/

## Usage

1. Sign in with Google or Email
2. Connect apps at `/integrations`
3. Start chatting with the AI assistant

Example commands:
- "Show me all deadlines this week"
- "Find PDFs from my Machine Learning course"
- "What's due this weekend?"

## How It Works

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

## Deploy

```bash
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
