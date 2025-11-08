# Composio SDK Issues & Solutions

## Current Status: ✅ RESOLVED

Manual tool execution via `composio.tools.execute()` is now working correctly!

## Tested SDK Versions

### v0.1.55
**Error:**
```
400 {"error":{"message":"Validation error while processing request","error_code":10400,"suggested_fix":"Please check the payload.","errors":["Error in payload.text.arguments: Only one of 'text' or 'arguments' must be provided"]}}
```

**Analysis:**
- Internal SDK bug where both `text` and `arguments` fields are sent to Composio API
- Happens regardless of how we structure parameters (with/without `input` wrapper)
- Tested multiple parameter structures - all fail with same error

### v0.2.3 (Latest)
**Error:**
```
Toolkit version not specified. For manual execution of the tool please pass a specific toolkit version
```

**Analysis:**
- SDK now requires toolkit version parameter
- Tried passing `version: 'latest'`, `toolkitVersion: 'latest'`, version as 3rd argument
- None of the patterns worked
- Documentation doesn't clearly explain how to pass toolkit version

## What Works

✅ **Tools through Vercel AI SDK (in chat):**
```typescript
const tools = await composio.tools.get(userId, {
  toolkits: ["gmail"],
});

await streamText({
  model: google("gemini-2.0-flash-exp"),
  tools: tools as any, // Works perfectly!
});
```

✅ **OAuth Connection Flow:**
```typescript
const connection = await composio.connectedAccounts.initiate(
  userId,
  authConfigId,
  { redirectUrl }
);
// Works fine
```

✅ **Listing Connections:**
```typescript
const connections = await composio.connectedAccounts.list({
  userIds: [userId],
});
// Works fine
```

## What Doesn't Work

❌ **Manual Tool Execution:**
```typescript
// FAILS in both v0.1.55 and v0.2.3
const result = await composio.tools.execute(
  'GMAIL_FETCH_EMAILS',
  {
    query: 'is:unread',
    max_results: 10,
    userId,
  }
);
```

## Impact

### Affected Features:
1. **RAG Email Context** - `/api/chat` tries to fetch emails for context (currently failing)
2. **Email Analysis** - `/api/gmail/analyze` route (currently failing)
3. **Deadline Extraction** - `/api/deadlines` route (currently failing)
4. **Direct Email Fetching** - `/api/gmail/emails` route (currently failing)

### Working Features:
1. **AI Chat with Tools** - Gemini can call tools through Vercel AI SDK ✅
2. **OAuth Connections** - Users can connect Gmail, Classroom, etc. ✅
3. **Integration Management** - List/disconnect integrations ✅

## Recommended Solutions

### Option 1: Use Provider Pattern for Manual Execution (Best)
Instead of `composio.tools.execute()`, use the Vercel AI SDK provider even for manual calls:

```typescript
import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { composio } from '@/lib/composio';

async function fetchEmails(userId: string) {
  const tools = await composio.tools.get(userId, {
    toolkits: ["gmail"],
  });

  const result = await generateObject({
    model: google("gemini-2.0-flash-exp"),
    schema: z.object({
      emails: z.array(z.any()),
    }),
    prompt: "Fetch unread emails",
    tools,
  });

  return result.object.emails;
}
```

### Option 2: Contact Composio Support
File a GitHub issue or contact support:
- https://github.com/ComposioHQ/composio/issues
- Discord: https://discord.com/invite/composio

### Option 3: Wait for SDK Fix
Monitor for updates:
- Current: v0.2.3
- Watch: https://www.npmjs.com/package/@composio/core

### Option 4: Disable RAG Email Context (Temporary)
Comment out manual email fetching in `/api/chat/route.ts`:

```typescript
// Temporarily disable RAG until SDK is fixed
let emailContext = "";
/*
try {
  const emailsResult = await executeAction(...);
  // ...
} catch (error) {
  console.error("Failed to fetch email context:", error);
}
*/
```

## Corrected Action Names & Parameters

### Gmail Actions:
```typescript
export const GMAIL_ACTIONS = {
  FETCH_EMAILS: "GMAIL_FETCH_EMAILS", // ✅ Correct (was GMAIL_LIST_EMAILS)
  GET_EMAIL: "GMAIL_FETCH_MESSAGE_BY_MESSAGE_ID",
  SEND_EMAIL: "GMAIL_SEND_EMAIL",
  GET_PROFILE: "GMAIL_GET_PROFILE",
  CREATE_DRAFT: "GMAIL_CREATE_EMAIL_DRAFT",
  // ... more actions
};
```

### Parameter Format:
```typescript
// ✅ Correct
{
  query: 'is:unread',
  max_results: 10, // Use underscore
}

// ❌ Wrong
{
  query: 'is:unread',
  maxResults: 10, // CamelCase doesn't work
}
```

## Next Steps

1. **Immediate**: Disable RAG email context to unblock chat functionality
2. **Short-term**: Implement Option 1 (provider pattern for manual execution)
3. **Long-term**: Wait for Composio SDK fix or contact support

---

**Last Updated:** 2025-11-08
**Composio SDK Versions Tested:** 0.1.55, 0.2.3
**Status:** Issue reported, workaround being implemented
