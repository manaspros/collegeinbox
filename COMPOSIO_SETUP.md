# Composio Integration Setup Guide

## Issue: Google Classroom Auth Config Missing

If you see:
```
Some auth configs could not be created. Please create them manually in Composio dashboard.
✅ gmail - Auth config already exists for Gmail
✅ googlecalendar - Auth config already exists for Google Calendar
✅ googledrive - Auth config already exists for Google Drive
❌ Google Classroom - Missing
```

## Solution 1: Manual Setup in Composio Dashboard (Recommended)

### Step 1: Go to Composio Dashboard
1. Visit [Composio Dashboard](https://app.composio.dev)
2. Sign in with your account

### Step 2: Navigate to Integrations
1. Click **Integrations** in the left sidebar
2. Search for "Google Classroom"

### Step 3: Add Google Classroom Integration
1. Click on **Google Classroom**
2. Click **Add Integration** or **Enable**
3. You'll see two options:

#### Option A: Use Composio's Managed Auth (Easiest)
- Click **Use Composio Auth**
- Composio manages the OAuth flow for you
- No setup needed - just works!
- ✅ **Recommended for quick setup**

#### Option B: Use Your Own OAuth Credentials
If you want to use your own Google Cloud project:

1. Click **Use Custom Auth**
2. You'll need:
   - **Client ID** (from Google Cloud Console)
   - **Client Secret** (from Google Cloud Console)
   - **Redirect URI** (provided by Composio)

**To get these from Google Cloud Console:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Navigate to **APIs & Services** → **Credentials**
4. Click **+ Create Credentials** → **OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Name: `Composio - Google Classroom`
7. **Authorized redirect URIs**: Copy from Composio dashboard
   - Should look like: `https://backend.composio.dev/api/v1/auth/google/callback`
8. Click **Create**
9. Copy the **Client ID** and **Client Secret**
10. Paste them into Composio dashboard
11. Click **Save**

### Step 4: Enable Required Scopes
In Composio dashboard, make sure these scopes are enabled:
- ✅ `classroom.courses.readonly`
- ✅ `classroom.coursework.me.readonly`
- ✅ `classroom.coursework.students.readonly`
- ✅ `classroom.rosters.readonly` (optional)

### Step 5: Test the Integration
1. Go back to your app at `/integrations`
2. Try connecting Google Classroom
3. Should work now! ✅

---

## Solution 2: Using Composio CLI (Alternative)

You can also set up integrations via Composio CLI:

```bash
# Install Composio CLI
npm install -g composio-core

# Login to Composio
composio login

# Add Google Classroom integration
composio add googleclassroom

# List all integrations to verify
composio integrations list
```

---

## Solution 3: Direct API Setup (Advanced)

If you want to manually create the auth config via Composio API:

```typescript
// In your backend (app/api/setup-integrations/route.ts)
import { composio } from "@/lib/composio";

export async function POST() {
  try {
    // Create auth config for Google Classroom
    const authConfig = await composio.createIntegration({
      appName: "googleclassroom",
      authScheme: "OAUTH2",
      authConfig: {
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        scope: [
          "https://www.googleapis.com/auth/classroom.courses.readonly",
          "https://www.googleapis.com/auth/classroom.coursework.me.readonly",
        ],
      },
    });

    return Response.json({ success: true, authConfig });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
```

---

## Why Composio Instead of MCP?

### Composio Advantages for This Use Case:
✅ **Per-User OAuth**: Each user authenticates their own Google account
✅ **Token Management**: Automatic refresh token handling
✅ **250+ Integrations**: Pre-built Gmail, Classroom, Calendar, Drive
✅ **Entity Management**: Maps Firebase UID → Composio entity
✅ **Security**: OAuth tokens stored securely by Composio
✅ **Built for AI Agents**: Designed for LLM function calling

### MCP Limitations:
❌ **No OAuth Support**: MCP servers don't handle user authentication
❌ **Server-Side Only**: Can't access user-specific data
❌ **Manual Setup**: Each integration needs custom implementation
❌ **Token Management**: You handle refresh tokens manually

### When to Use MCP:
- Accessing public APIs (no auth needed)
- Server-side operations (API keys)
- Custom business logic
- Local file system access

---

## If You Really Want MCP (Not Recommended for This App)

Here's why it won't work well for this use case:

### MCP Servers Available:
- **@modelcontextprotocol/server-google-drive** - Requires service account
- **@modelcontextprotocol/server-gmail** - Requires service account
- **No official Google Classroom MCP server exists**

### Setup (Will Have Limitations):

```bash
# Install MCP servers
npm install @modelcontextprotocol/server-google-drive
npm install @modelcontextprotocol/server-gmail
```

**Problem**: MCP servers use service accounts, which:
- Don't work with Google Classroom (user-specific data)
- Require Google Workspace domain-wide delegation
- Can't access personal Gmail/Calendar without admin permissions
- Won't work for individual students

### MCP Configuration (claude_desktop_config.json):
```json
{
  "mcpServers": {
    "google-drive": {
      "command": "node",
      "args": ["node_modules/@modelcontextprotocol/server-google-drive/dist/index.js"],
      "env": {
        "GOOGLE_SERVICE_ACCOUNT_KEY": "/path/to/service-account.json"
      }
    }
  }
}
```

**This won't work for:**
- Individual student Gmail accounts
- Personal Google Classroom courses
- User-specific calendars

---

## Recommended Solution: Stick with Composio

### Quick Fix Steps:

1. **Go to [Composio Dashboard](https://app.composio.dev)**
2. **Integrations** → Search "Google Classroom"
3. Click **Enable** → Choose **Use Composio Auth**
4. Done! ✅

This takes 2 minutes and handles everything:
- OAuth flow
- Token refresh
- User authentication
- Security

### Verify in Your App:

```typescript
// Test in your code
import { composio } from "@/lib/composio";

// Check available integrations
const integrations = await composio.getIntegrations();
console.log(integrations); // Should include googleclassroom

// Test connection
const entity = await composio.getEntity("test-user-id");
const tools = await composio.getToolSet().getTools({
  apps: ["gmail", "googleclassroom", "googlecalendar", "googledrive"],
  entityId: "test-user-id",
});
console.log(tools.length); // Should be > 0
```

---

## Troubleshooting

### Issue: "Auth config already exists"
**Solution**: This is good! It means Gmail, Calendar, and Drive are set up. Just add Classroom.

### Issue: "Google Classroom not found in Composio"
**Solution**:
1. Make sure you're on a Composio plan that supports Google Classroom
2. Try the Composio Managed Auth option
3. Contact Composio support if it's still missing

### Issue: "Invalid scopes"
**Solution**:
1. Go to Google Cloud Console
2. OAuth consent screen → Scopes
3. Add Classroom scopes
4. Re-authorize in Composio

### Issue: "Connection fails after setup"
**Solution**:
1. Clear browser cache
2. Try OAuth flow again
3. Check Google Cloud Console → Credentials → Authorized redirect URIs
4. Make sure Composio's redirect URI is added

---

## Alternative: Hybrid Approach

If you really want to use MCP for some features:

```typescript
// Use Composio for OAuth-required services
import { composio } from "@/lib/composio";

// Use MCP for non-OAuth services (if needed)
import { MCPClient } from "@modelcontextprotocol/sdk";

// Example: Composio for user data
const gmailData = await entity.execute("gmail_list_emails", {
  query: "is:unread",
});

// Example: MCP for server-side operations (if you have any)
// But for this app, you don't need MCP at all
```

---

## TL;DR

**Problem**: Google Classroom auth config missing in Composio

**Solution**:
1. Go to [Composio Dashboard](https://app.composio.dev)
2. Integrations → Google Classroom → Enable
3. Choose "Use Composio Auth"
4. Test in your app

**Don't use MCP because**:
- No OAuth support for per-user data
- Google Classroom requires user authentication
- Composio is built for this exact use case

**Composio = Perfect for this app** ✅

---

Need help? Check:
- [Composio Docs](https://docs.composio.dev)
- [Composio Discord](https://discord.gg/composio)
- Or DM Composio support in their dashboard
