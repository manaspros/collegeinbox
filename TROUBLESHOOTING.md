# Troubleshooting Guide

## Common Issues and Solutions

### 1. ❌ "This app is blocked" Error

**Issue**: When connecting Google Classroom, you see:
```
This app is blocked
This app tried to access sensitive info in your Google Account.
```

**Solution**: See [OAUTH_SETUP.md](./OAUTH_SETUP.md) for detailed instructions.

**Quick Fix**:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. OAuth consent screen → Add yourself as test user
3. Try OAuth flow again
4. Click "Advanced" → "Go to app (unsafe)"

---

### 2. ❌ Google Classroom Integration Missing in Composio

**Issue**:
```
Some auth configs could not be created
gmail - Auth config already exists ✅
googlecalendar - Auth config already exists ✅
googledrive - Auth config already exists ✅
googleclassroom - Missing ❌
```

**Solution**: See [COMPOSIO_SETUP.md](./COMPOSIO_SETUP.md) for detailed instructions.

**Quick Fix**:
1. Go to [Composio Dashboard](https://app.composio.dev/integrations)
2. Search "Google Classroom"
3. Click "Enable" → Choose "Use Composio Auth"
4. Done!

**Verify**:
```bash
npm run verify:composio
```

---

### 3. ❌ "Error executing tool GMAIL_LIST_EMAILS version:undefined"

**Issue**:
```
Error executing tool GMAIL_LIST_EMAILS version:undefined
either search for version or skip it
```

**Root Cause**: Composio action names were incorrect or version mismatch.

**Solution**: ✅ **Already Fixed**

We've:
1. Created `lib/composio-actions.ts` with correct action names
2. Added `executeComposioAction()` helper with better error handling
3. Updated all API routes to use the correct action constants:
   - `GMAIL_ACTIONS.LIST_EMAILS` instead of `"gmail_list_emails"`
   - `CLASSROOM_ACTIONS.LIST_COURSES` instead of `"googleclassroom_list_courses"`
   - etc.

**Correct Action Names**:
```typescript
// ✅ Correct
import { GMAIL_ACTIONS, executeComposioAction } from "@/lib/composio-actions";
await executeComposioAction(entity, GMAIL_ACTIONS.LIST_EMAILS, { maxResults: 10 });

// ❌ Incorrect (old method)
await entity.execute("gmail_list_emails", { maxResults: 10 });
```

**All Composio Actions**:
See `lib/composio-actions.ts` for complete list of action constants.

---

### 4. ❌ Firebase Auth Errors

**Issue**: "Firebase not configured" or auth not working

**Solutions**:

#### A. Missing Environment Variables
Check `.env.local` has all Firebase config:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

#### B. Firebase Auth Not Enabled
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Authentication → Sign-in method
3. Enable "Google" and "Email/Password"

#### C. Authorized Domains
1. Firebase Console → Authentication → Settings
2. Authorized domains → Add:
   - `localhost`
   - Your Vercel domain

---

### 5. ❌ Gemini API Errors

**Issue**: "Invalid API key" or "Gemini AI error"

**Solutions**:

#### A. Invalid or Missing Key
```env
GEMINI_API_KEY=your_actual_key_here
```
Get key from: https://aistudio.google.com/apikey

#### B. API Quota Exceeded
- Free tier: 60 requests/minute
- Check quota: https://aistudio.google.com/apikey
- Upgrade if needed

#### C. Model Name Issue
We use `gemini-2.0-flash-exp`. If it fails, try:
```typescript
// In lib/gemini.ts
export function getGeminiModel(modelName: string = "gemini-1.5-flash") {
  return genAI.getGenerativeModel({ model: modelName });
}
```

---

### 6. ❌ Composio Tool Execution Fails

**Issue**: Tools fail with various errors

**Debugging**:
```bash
# Run verification script
npm run verify:composio

# Check logs in browser console (F12)
# Check server logs in terminal
```

**Common Fixes**:

#### A. User Not Connected to Service
1. Go to `/integrations`
2. Connect the service (Gmail, Classroom, etc.)
3. Complete OAuth flow
4. Try again

#### B. Invalid Scopes
Make sure OAuth consent screen has all required scopes:
```
https://www.googleapis.com/auth/gmail.readonly
https://www.googleapis.com/auth/classroom.courses.readonly
https://www.googleapis.com/auth/calendar.readonly
https://www.googleapis.com/auth/drive.readonly
```

#### C. Action Name Typo
Use constants from `lib/composio-actions.ts`:
```typescript
// ✅ Correct
GMAIL_ACTIONS.LIST_EMAILS
CLASSROOM_ACTIONS.LIST_COURSES
CALENDAR_ACTIONS.LIST_EVENTS
DRIVE_ACTIONS.LIST_FILES

// ❌ Wrong
"gmail_list_emails"
"GMAIL_GET_EMAILS"
```

---

### 7. ❌ Firestore Permission Errors

**Issue**: "Missing or insufficient permissions"

**Solutions**:

#### A. Test Mode Rules
For development, use test mode rules:
```javascript
// Firestore Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.time < timestamp.date(2025, 12, 31);
    }
  }
}
```

#### B. Production Rules
For production:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User-specific data
    match /cache_deadlines/{userId}/items/{item} {
      allow read, write: if request.auth.uid == userId;
    }
    match /cache_documents/{userId}/files/{file} {
      allow read, write: if request.auth.uid == userId;
    }
    match /cache_alerts/{userId}/items/{alert} {
      allow read, write: if request.auth.uid == userId;
    }
    match /push_subscriptions/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

---

### 8. ❌ Cron Job Not Running

**Issue**: Daily 8 AM routine not executing

**Solutions**:

#### A. Vercel Cron Setup
1. Make sure `vercel.json` exists with:
```json
{
  "crons": [
    {
      "path": "/api/cron/daily",
      "schedule": "0 8 * * *"
    }
  ]
}
```

#### B. Deploy to Vercel
Cron jobs only work in production:
```bash
vercel --prod
```

#### C. Manual Testing
Test the endpoint manually:
```bash
curl -X POST https://your-app.vercel.app/api/cron/daily?userId=YOUR_USER_ID \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

#### D. Check Logs
1. Vercel Dashboard → Your project
2. Deployments → Latest → Functions
3. Find `/api/cron/daily` → View logs

---

### 9. ❌ Web Push Notifications Not Working

**Issue**: Notifications not received

**Solutions**:

#### A. VAPID Keys Missing
Generate VAPID keys:
```bash
npx web-push generate-vapid-keys
```

Add to `.env.local`:
```env
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
```

#### B. Service Worker Not Registered
Check in browser console:
```javascript
navigator.serviceWorker.getRegistrations().then(console.log);
// Should show registered service worker
```

#### C. Notification Permission
```javascript
Notification.permission
// Should be "granted"
```

Request permission:
```javascript
await Notification.requestPermission();
```

#### D. HTTPS Required
Web Push only works on:
- `https://` (production)
- `localhost` (development)

---

### 10. ❌ Voice Assistant Not Working

**Issue**: Voice commands not recognized

**Solutions**:

#### A. Browser Support
Voice Assistant requires:
- Chrome/Edge/Safari (WebKit-based)
- NOT supported in Firefox

Check support:
```javascript
'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
```

#### B. Microphone Permission
1. Browser should prompt for mic access
2. Check browser settings → Privacy → Microphone
3. Allow for your domain

#### C. HTTPS Required
Web Speech API requires:
- `https://` (production)
- `localhost` (development)

---

## Debugging Tips

### Enable Verbose Logging

**1. Browser Console**
```javascript
// In browser console
localStorage.setItem('DEBUG', '*');
```

**2. Server Logs**
```typescript
// In any API route
console.log('Debug:', { userId, params, result });
```

**3. Composio Logs**
```typescript
// In lib/composio-actions.ts
export async function executeComposioAction(...) {
  console.log(`Executing: ${actionName}`, params);
  // ...
  console.log(`Result:`, result);
}
```

### Check Network Requests

1. Open browser DevTools (F12)
2. Network tab
3. Filter by:
   - XHR/Fetch
   - Your API routes (`/api/...`)
4. Check:
   - Request payload
   - Response status
   - Response body

### Test Individual Components

**Test Composio Connection**:
```bash
npm run verify:composio
```

**Test Firebase Auth**:
```javascript
// In browser console on /dashboard
import { auth } from './lib/firebase';
console.log(auth.currentUser);
```

**Test Gemini API**:
```bash
curl https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent \
  -H "Content-Type: application/json" \
  -H "x-goog-api-key: YOUR_KEY" \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'
```

---

## Getting Help

If none of the above solutions work:

1. **Check Documentation**:
   - [SETUP.md](./SETUP.md) - Initial setup
   - [OAUTH_SETUP.md](./OAUTH_SETUP.md) - OAuth issues
   - [COMPOSIO_SETUP.md](./COMPOSIO_SETUP.md) - Composio issues
   - [IMPLEMENTATION.md](./IMPLEMENTATION.md) - Architecture details

2. **Check Logs**:
   - Browser console (F12)
   - Terminal (where `npm run dev` is running)
   - Vercel logs (if deployed)

3. **External Resources**:
   - [Composio Docs](https://docs.composio.dev)
   - [Composio Discord](https://discord.gg/composio)
   - [Firebase Docs](https://firebase.google.com/docs)
   - [Gemini API Docs](https://ai.google.dev/gemini-api/docs)

4. **Common Status Pages**:
   - Composio: https://status.composio.dev
   - Firebase: https://status.firebase.google.com
   - Google Cloud: https://status.cloud.google.com

---

## Quick Checklist

Before asking for help, verify:

- [ ] All environment variables are set in `.env.local`
- [ ] `npm install` completed without errors
- [ ] Firebase Auth is enabled (Google + Email/Password)
- [ ] Firestore is created and accessible
- [ ] Composio API key is valid
- [ ] Gemini API key is valid
- [ ] OAuth consent screen configured (if using own credentials)
- [ ] Test user added to OAuth consent screen
- [ ] All integrations connected in Composio dashboard
- [ ] Browser console shows no errors
- [ ] Server terminal shows no errors
- [ ] Tried `npm run verify:composio`

---

**Last Updated**: Based on implementation as of November 2025
