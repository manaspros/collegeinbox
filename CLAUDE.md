# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Collegiate Inbox Navigator** - AI-powered academic assistant for college students. Helps manage emails, assignments, deadlines, and course materials through natural language queries.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Google Gemini 2.0, Composio v3, Firebase, Material-UI v7

## Development Commands

```bash
# Start development server (port 3000)
npm run dev

# Production build
npm run build

# Lint code
npm run lint

# Test Composio integration
npm run verify:composio
```

## Architecture Overview

### Core Systems

**1. AI Chat Agent (`/api/chat`)**
- Uses Vercel AI SDK's `streamText()` with Gemini 2.0 Flash
- Composio provides tools (Gmail, Calendar, Classroom, Drive)
- RAG system adds recent email context to system prompt
- Streams responses in real-time to client

**2. Composio Integration (`lib/composio.ts`)**
- OAuth gateway for Google services
- Key functions:
  - `getConnectionLink()` - Initiate OAuth flow
  - `executeAction(userId, action, params, connectedAccountId)` - Execute tools
  - `getConnectedAccountId(userId, toolkitSlug)` - Get active connection
  - `hasConnection(userId, app)` - Check connection status

**3. Data Flow**
```
User Query → /api/chat → Gemini + Composio Tools → Tool Execution → Stream Response
                ↓
            Fetch email context (RAG) for system prompt
                ↓
            Firestore cache (deadlines, documents, alerts)
```

### Important File Locations

**API Routes:**
- `/app/api/chat/route.ts` - Main AI chat endpoint (streaming with tool calling)
- `/app/api/integrations/connect/route.ts` - OAuth connection initiation
- `/app/api/gmail/*` - Email operations (fetch, analyze, summarize)
- `/app/api/rag/route.ts` - RAG sync/search (planned)

**Libraries:**
- `lib/composio.ts` - Composio v3 SDK wrapper (THIS IS THE SOURCE OF TRUTH for Composio integration)
- `lib/gemini.ts` - Gemini AI functions (categorization, summarization, extraction)
- `lib/firebaseAdmin.ts` - Firebase Admin SDK setup

**Components:**
- `components/ChatInterface.tsx` - AI chat UI with streaming
- `components/IntegrationManager.tsx` - OAuth connection management

## Composio v3 API Patterns

**IMPORTANT:** This project uses Composio v3 (@composio/core v0.1.55). The API has specific patterns:

### Getting Connection Link (OAuth)
```typescript
// Step 1: Get auth configs
const authConfigs = await composio.authConfigs.list({});

// Step 2: Filter for toolkit
const gmailConfig = authConfigs.items.find(c =>
  c.toolkitSlug?.toLowerCase() === 'gmail'
);

// Step 3: Initiate connection
const connection = await composio.connectedAccounts.initiate(
  userId,           // Firebase UID
  authConfig.id,    // Auth config ID (NOT toolkit slug)
  {
    redirectUrl: 'http://localhost:3000/integrations',
  }
);
```

### Executing Tools
```typescript
// With connected account ID (preferred)
const result = await composio.tools.execute(
  'GMAIL_LIST_EMAILS',
  {
    input: { query: 'is:unread', maxResults: 10 },
    connectedAccountId: 'conn_xxx',
  }
);

// With userId (auto-finds connection)
const result = await composio.tools.execute(
  'GMAIL_LIST_EMAILS',
  {
    input: { query: 'is:unread', maxResults: 10 },
    userId: firebaseUid,
  }
);
```

### Listing Connections
```typescript
const connections = await composio.connectedAccounts.list({
  userIds: [firebaseUid],  // NOT user_ids (array)
});
```

## Environment Variables

Required in `.env` or `.env.local`:

```bash
# Composio (OAuth gateway)
COMPOSIO_API_KEY=xxx

# Google Gemini
GEMINI_API_KEY=xxx
GOOGLE_GENERATIVE_AI_API_KEY=xxx

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=xxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxx
FIREBASE_ADMIN_SDK_JSON={"type":"service_account",...}

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Key Architectural Decisions

### 1. Why Composio v3?
- Single SDK for 250+ integrations (Gmail, Calendar, Classroom, Drive, Slack, etc.)
- OAuth flows handled automatically
- Direct tool execution without managing API clients
- Entity-based user isolation (Firebase UID = Composio entity ID)

### 2. Gemini + Composio Pattern
- Gemini 2.0 Flash for low latency chat
- Vercel AI SDK `streamText()` handles streaming + tool calling
- Composio tools provided as function declarations to Gemini
- Gemini decides which tools to call based on user query

### 3. RAG Implementation
- **Basic (Current):** Fetch recent 50 emails, add to system prompt as context
- **Advanced (Planned):** Generate embeddings → Firestore → Semantic search
- Located at: `app/api/rag/route.ts` (sync, search, stats actions)

### 4. Firebase Structure
```
Firestore Collections:
- deadlines/{userId}/events       # Extracted due dates
- documents/{userId}/files        # PDFs, DOCX, PPT
- alerts/{userId}/items          # Schedule changes
- email_embeddings/{userId}/emails  # RAG vectors (planned)
```

## Common Development Tasks

### Adding a New Composio Tool

**Example: Adding Slack integration**

1. **Enable in Composio Dashboard:**
   - Go to https://app.composio.dev/integrations
   - Search "Slack"
   - Enable integration

2. **Get auth config in code:**
```typescript
const slackConfigs = authConfigs.items.filter(c =>
  c.toolkitSlug?.toLowerCase() === 'slack'
);
```

3. **Initiate connection:**
```typescript
const connection = await composio.connectedAccounts.initiate(
  userId,
  slackConfig.id,
  { redirectUrl }
);
```

4. **Execute tool:**
```typescript
const result = await composio.tools.execute(
  'SLACK_SEND_MESSAGE',
  {
    input: { channel: '#general', text: 'Hello!' },
    userId: firebaseUid,
  }
);
```

### Testing Chat with Tools

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "YOUR_FIREBASE_UID",
    "messages": [{
      "role": "user",
      "content": "Show me my unread emails"
    }]
  }'
```

### Debugging Composio Issues

1. **Check connection status:**
```typescript
const connections = await getUserConnections(userId);
console.log(connections);
```

2. **Verify auth configs exist:**
```typescript
const authConfigs = await composio.authConfigs.list({});
console.log('Available toolkits:',
  authConfigs.items.map(c => c.toolkitSlug)
);
```

3. **Test tool execution:**
```bash
npm run verify:composio
```

## Integration Setup

**Before connecting integrations, enable them in Composio dashboard:**

1. Go to https://app.composio.dev/integrations
2. Search for: Gmail, Google Drive, Google Classroom, Google Calendar
3. Click "Enable Integration" for each (use Composio's default OAuth for quick setup)
4. Then users can connect in your app at `/integrations`

**See `INTEGRATION_SETUP_GUIDE.md` for detailed setup instructions.**

## Known Issues & Workarounds

### Issue: "Auth config not found"
**Cause:** Integration not enabled in Composio dashboard
**Fix:** Enable the integration at https://app.composio.dev/integrations

### Issue: "Failed to parse connected account list query"
**Cause:** Wrong parameter name (e.g., `user_ids` vs `userIds`)
**Fix:** Use `userIds: [firebaseUid]` (camelCase array)

### Issue: Old build errors in Next.js
**Cause:** Legacy API routes use outdated Next.js 16 param patterns
**Impact:** Doesn't affect new AI backend (`/api/chat`, `/api/rag`)
**Status:** Low priority - new backend works correctly

## Path Aliases

TypeScript path alias configured:
```typescript
import { composio } from '@/lib/composio';  // @ = project root
```

## React Compiler

React Compiler is **enabled** in `next.config.ts`:
```typescript
experimental: { reactCompiler: true }
```
This automatically optimizes component memoization.

## Testing the AI Backend

**Health checks:**
```bash
curl http://localhost:3000/api/chat      # Chat endpoint
curl http://localhost:3000/api/rag       # RAG endpoint
```

**Full test sequence (see `TEST_RESULTS.md`):**
1. Connect Gmail in `/integrations`
2. Sync emails: `POST /api/rag` with `action: "sync"`
3. Search emails: `POST /api/rag` with `action: "search"`
4. Chat query: `POST /api/chat` with user message

## Documentation Files

- `QUICKSTART.md` - Fast testing guide for AI backend
- `AI_BACKEND_GUIDE.md` - Complete API reference
- `INTEGRATION_SETUP_GUIDE.md` - Step-by-step integration setup
- `AI_REBUILD_COMPLETE.md` - Architecture summary
- `TEST_RESULTS.md` - Verified test outputs
- `REBUILD_PLAN.md` - Original rebuild specification

## Recent Changes (AI Backend Rebuild)

The AI backend was recently rebuilt with clean, modular architecture:

**New files (all working):**
- `lib/ai/composio.ts` - Composio v3 integration
- `lib/ai/gemini.ts` - Gemini AI + embeddings
- `lib/ai/mcp.ts` - MCP tool registry
- `lib/ai/rag.ts` - Gmail RAG pipeline
- `lib/ai/agent.ts` - Main orchestrator
- `app/api/chat/route.ts` - Chat endpoint (replaced old version)
- `app/api/rag/route.ts` - RAG testing endpoint

**Status:** ✅ Tested and working (see `TEST_RESULTS.md`)

**Note:** The old `lib/composio.ts` file is the **active implementation**. The new `lib/ai/*` files are a modular refactor that can be switched to in the future.

## Vercel Deployment

Deployment config in `vercel.json`:
```json
{
  "env": {
    "COMPOSIO_API_KEY": "@composio-api-key",
    "GEMINI_API_KEY": "@gemini-api-key"
  }
}
```

Set environment variables in Vercel dashboard before deploying.

---

**Current Status:** AI backend fully functional. Chat works with Gemini + Composio tools. RAG basic implementation working. Ready for production deployment after completing integration connections.
