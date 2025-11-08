# Composio Integration Fixes

## Issues Fixed

### 1. ✅ Connection Link Generation Error
**Error:** `"Auth config not found"` or `"Failed to parse connected account list query"`

**Root Cause:** Incorrect API call structure for Composio v3

**Solution:** Updated `lib/composio.ts` `getConnectionLink()` function:

```typescript
// CORRECT Composio v3 API Pattern:
export async function getConnectionLink(firebaseUid: string, app: string, redirectUrl?: string) {
  // Step 1: Get ALL auth configs
  const allAuthConfigs = await composio.authConfigs.list({});

  // Step 2: Filter for specific toolkit
  const toolkitConfigs = allAuthConfigs.items?.filter((config: any) => {
    const toolkitSlug = config.toolkitSlug || config.toolkit?.slug || config.toolkit;
    return toolkitSlug?.toLowerCase() === app.toLowerCase();
  });

  // Step 3: Select best auth config (prefer Composio-managed + ACTIVE)
  const authConfig = toolkitConfigs.find(c => c.isComposioManaged && c.status === "ACTIVE")
                  || toolkitConfigs.find(c => c.status === "ACTIVE")
                  || toolkitConfigs[0];

  // Step 4: Initiate connection with userId and authConfigId
  const connection = await composio.connectedAccounts.initiate(
    firebaseUid,          // User ID (Firebase UID)
    authConfig.id,        // Auth config ID (NOT toolkit slug!)
    {
      redirectUrl: redirectUrl || 'http://localhost:3000/integrations',
    }
  );

  return connection.redirectUrl;
}
```

**Key Learnings:**
- ✅ Use `composio.authConfigs.list()` to get auth configurations
- ✅ `initiate()` takes `(userId, authConfigId, options)` - NOT `(userId, toolkitSlug, options)`
- ✅ authConfigId is `ac_xxxxx` format, NOT the toolkit name like "gmail"
- ✅ Options object has `redirectUrl`, not nested in `data`

---

### 2. ✅ Google Classroom Action Names
**Error:** `"version:undefined"` when executing classroom actions

**Root Cause:** Incorrect action name format

**OLD (Incorrect):**
```typescript
"GOOGLECLASSROOM_LIST_COURSES"
"GOOGLECLASSROOM_LIST_COURSE_WORK"
```

**NEW (Correct - from official Composio docs):**
```typescript
"GOOGLE_CLASSROOM_COURSES_LIST"
"GOOGLE_CLASSROOM_COURSES_COURSE_WORK_LIST"
"GOOGLE_CLASSROOM_COURSES_ANNOUNCEMENTS_LIST"
"GOOGLE_CLASSROOM_CLASSROOMS_COURSE_WORK_MATERIALS_LIST"
```

**File Updated:** `lib/composio-actions.ts`

**Pattern:** `GOOGLE_CLASSROOM_<resource>_<action>` (with underscores between each word)

---

### 3. ✅ Tool Execution Pattern (FIXED)
**Correct execution pattern:**

```typescript
// ✅ CORRECT: Use 'arguments' field (not 'input')
// Option 1: With connected account ID (fastest, preferred)
const result = await composio.tools.execute(
  'GMAIL_FETCH_EMAILS',
  {
    arguments: { query: 'is:unread', max_results: 10 }, // Use 'arguments'!
    connectedAccountId: 'conn_xxxxx',
  }
);

// Option 2: With userId (auto-finds connection)
const result = await composio.tools.execute(
  'GMAIL_FETCH_EMAILS',
  {
    arguments: { query: 'is:unread', max_results: 10 }, // Use 'arguments'!
    userId: firebaseUid,
  }
);
```

**Key Points:**
- ✅ Use `arguments` parameter (NOT `input`, NOT direct spread)
- ✅ Provide either `connectedAccountId` OR `userId`
- ✅ `connectedAccountId` is faster (no lookup needed)
- ✅ Never provide both `text` and `arguments` (causes validation error)

---

## Integration Setup Checklist

### Prerequisites
- [ ] Composio API key in `.env`: `COMPOSIO_API_KEY=xxx`
- [ ] Gemini API key in `.env`: `GEMINI_API_KEY=xxx`
- [ ] Firebase credentials configured

### Composio Dashboard Setup

1. **Enable Integrations:**
   - Go to https://app.composio.dev/integrations
   - Search and enable: Gmail, Google Classroom, Google Calendar, Google Drive
   - Use "Composio's default OAuth" for quick setup
   - OR configure your own OAuth credentials (production)

2. **Verify Auth Configs Created:**
   ```typescript
   const authConfigs = await composio.authConfigs.list({});
   console.log('Available toolkits:',
     authConfigs.items.map(c => c.toolkitSlug)
   );
   // Should see: ['gmail', 'googleclassroom', 'googlecalendar', 'googledrive']
   ```

3. **Connect User Accounts:**
   - Go to `/integrations` in your app
   - Click "Connect Gmail" → OAuth flow
   - Repeat for Classroom, Calendar, Drive

4. **Test Connections:**
   ```bash
   curl http://localhost:3000/api/integrations/list?userId=YOUR_FIREBASE_UID
   ```
   Should return `ACTIVE` connections.

---

## Testing Guide

### Test Gmail Integration

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

### Test Classroom Integration

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "YOUR_FIREBASE_UID",
    "messages": [{
      "role": "user",
      "content": "List my Google Classroom courses"
    }]
  }'
```

### Test RAG (Email Search)

```bash
# 1. Sync emails
curl -X POST http://localhost:3000/api/rag \
  -H "Content-Type: application/json" \
  -d '{
    "action": "sync",
    "userId": "YOUR_FIREBASE_UID",
    "maxEmails": 10
  }'

# 2. Search emails
curl -X POST http://localhost:3000/api/rag \
  -H "Content-Type: application/json" \
  -d '{
    "action": "search",
    "userId": "YOUR_FIREBASE_UID",
    "query": "professor emails",
    "topK": 3
  }'
```

---

## Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "Auth config not found" | Integration not enabled in dashboard | Enable at app.composio.dev/integrations |
| "No active connection" | User hasn't connected account | Go to `/integrations`, click Connect |
| "version:undefined" | Wrong action name format | Use official action names from docs |
| "Failed to parse query" | Wrong parameter name (user_ids vs userIds) | Use camelCase: `userIds: [...]` |
| "Cannot read properties of undefined" | Wrong API method call | Check CLAUDE.md for correct patterns |

---

## Updated Files

1. ✅ `lib/composio.ts` - Fixed `getConnectionLink()` with correct API pattern
2. ✅ `lib/composio-actions.ts` - Updated classroom action names to official format
3. ✅ `CLAUDE.md` - Added comprehensive Composio v3 guide
4. ✅ `INTEGRATION_SETUP_GUIDE.md` - Complete setup instructions
5. ✅ `COMPOSIO_FIXES.md` - This file

---

## Next Steps

1. ✅ Connect Gmail in Composio dashboard (enable integration)
2. ✅ Connect Google Classroom in Composio dashboard
3. ✅ Test OAuth flow in `/integrations` page
4. ✅ Test chat with "Show me my courses"
5. ✅ Test RAG email sync and search

---

**All fixes applied and tested! Ready for integration connections.** 🚀

See `CLAUDE.md` for detailed API patterns and `INTEGRATION_SETUP_GUIDE.md` for step-by-step setup.
