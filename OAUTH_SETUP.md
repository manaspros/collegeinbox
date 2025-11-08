# Google OAuth Setup Guide - Fixing "This app is blocked" Error

## Problem
When connecting Google Classroom (or other sensitive Google services), you see:
```
This app is blocked
This app tried to access sensitive info in your Google Account.
To keep your account safe, Google blocked this access.
```

## Why This Happens
Google Classroom, Gmail, and Calendar require **sensitive scopes**. Google blocks unverified apps from accessing these scopes to protect users. For development/testing, you need to add yourself as a test user.

---

## Solution: Add Test Users (Development)

### Step 1: Go to Google Cloud Console
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project (or create a new one)

### Step 2: Navigate to OAuth Consent Screen
1. In the left sidebar, go to **APIs & Services** → **OAuth consent screen**
2. You should see your app's consent screen configuration

### Step 3: Configure User Type
- If you see "Internal" vs "External" choice:
  - **Internal**: Only for Google Workspace users (if you have a workspace)
  - **External**: For any Google account (choose this for most cases)
- Click **External** → **Create**

### Step 4: Fill Out App Information
1. **App name**: `Collegiate Inbox Navigator`
2. **User support email**: Your email
3. **App logo**: (optional)
4. **App domain**: Your Vercel domain or `http://localhost:3000` for dev
5. **Authorized domains**:
   - `localhost` (for development)
   - Your Vercel domain (for production)
6. **Developer contact**: Your email
7. Click **Save and Continue**

### Step 5: Add Scopes
1. Click **Add or Remove Scopes**
2. Add these scopes:
   ```
   .../auth/userinfo.email
   .../auth/userinfo.profile
   .../auth/gmail.readonly
   .../auth/gmail.send
   .../auth/classroom.courses.readonly
   .../auth/classroom.coursework.me.readonly
   .../auth/calendar.readonly
   .../auth/calendar.events
   .../auth/drive.readonly
   ```
3. Click **Update** → **Save and Continue**

### Step 6: Add Test Users ⭐ (MOST IMPORTANT)
1. Click **+ Add Users**
2. Enter your Google account email (the one you'll use to test)
3. Click **Add**
4. You can add multiple test users (up to 100)
5. Click **Save and Continue**

### Step 7: Summary
- Review your settings
- Click **Back to Dashboard**

---

## Solution for Production: App Verification

For a production app, you need Google's verification:

### Requirements:
1. **Privacy Policy URL** (hosted publicly)
2. **Terms of Service URL** (hosted publicly)
3. **App homepage** (your Vercel deployment)
4. **YouTube video** showing how your app uses each scope
5. **Domain verification** (prove you own the domain)

### Process:
1. Complete all OAuth consent screen fields
2. Click **Publish App**
3. Click **Prepare for Verification**
4. Submit verification request
5. Wait 4-6 weeks for Google review

**For a hackathon/demo**, use test users instead!

---

## Alternative: Use Composio's Managed OAuth

Composio handles OAuth for you and may already be verified. Check your Composio dashboard:

### Step 1: Check Composio Integration Settings
1. Go to [Composio Dashboard](https://app.composio.dev)
2. Navigate to **Integrations**
3. Check if Google Classroom is listed as "Verified"

### Step 2: Use Composio's OAuth Flow
If Composio manages the OAuth:
- Users authenticate through Composio's verified app
- No need for your own Google Cloud project
- Already has all necessary scopes

### Step 3: Configure Redirect URLs
In your Composio settings:
1. Add redirect URLs:
   - `http://localhost:3000/integrations`
   - `https://your-app.vercel.app/integrations`
2. Save changes

---

## Quick Fix for Development

If you just want to test quickly:

### Option 1: Add Yourself as Test User (Recommended)
Follow **Step 6** above - takes 2 minutes!

### Option 2: Use Personal API Keys
1. Create a new Google Cloud project
2. Enable APIs:
   - Gmail API
   - Google Classroom API
   - Google Calendar API
   - Google Drive API
3. Create OAuth 2.0 credentials
4. Add your email as test user
5. Use these credentials in Composio

### Option 3: Use Service Account (Limited)
- Service accounts work for some APIs but NOT Classroom
- Only works for domain-wide delegation (Google Workspace)
- Not recommended for user-specific data

---

## Verifying It Works

After adding yourself as a test user:

1. Clear browser cache/cookies
2. Try the OAuth flow again
3. You should see a warning: "Google hasn't verified this app"
4. Click **Advanced** → **Go to [App Name] (unsafe)**
5. Grant permissions
6. Should redirect back successfully

---

## Common Issues

### Issue 1: "Access blocked: Authorization Error"
**Solution**: Make sure you added your email as a test user (Step 6)

### Issue 2: "redirect_uri_mismatch"
**Solution**:
- Check Composio redirect URL matches your app URL
- In Google Cloud Console → Credentials → OAuth 2.0 Client IDs
- Add `http://localhost:3000/integrations` to Authorized redirect URIs

### Issue 3: "This app isn't verified"
**Solution**: This is normal for development!
- Click "Advanced" → "Go to app (unsafe)"
- Or add yourself as test user to skip this warning

### Issue 4: Scopes not showing up
**Solution**:
- Go to OAuth consent screen → Scopes
- Make sure all required scopes are added
- Save and try again

---

## Required Scopes for This App

```
# User Info
https://www.googleapis.com/auth/userinfo.email
https://www.googleapis.com/auth/userinfo.profile

# Gmail
https://www.googleapis.com/auth/gmail.readonly
https://www.googleapis.com/auth/gmail.send
https://www.googleapis.com/auth/gmail.modify

# Google Classroom
https://www.googleapis.com/auth/classroom.courses.readonly
https://www.googleapis.com/auth/classroom.coursework.me.readonly
https://www.googleapis.com/auth/classroom.coursework.students.readonly

# Google Calendar
https://www.googleapis.com/auth/calendar.readonly
https://www.googleapis.com/auth/calendar.events

# Google Drive
https://www.googleapis.com/auth/drive.readonly
https://www.googleapis.com/auth/drive.file
```

---

## For Hackathon Demo

**Recommended approach**:
1. Add all judges/demo viewers as test users
2. Keep app in "Testing" status (not published)
3. Demo will work perfectly for test users
4. No verification needed

**Maximum test users**: 100 (more than enough for a hackathon)

---

## Troubleshooting Checklist

- [ ] Google Cloud project created
- [ ] OAuth consent screen configured
- [ ] User type set to "External"
- [ ] All required scopes added
- [ ] Your email added as test user
- [ ] Redirect URIs match Composio settings
- [ ] Browser cache cleared
- [ ] Tried OAuth flow again

---

## Need Help?

If you're still stuck:
1. Check Composio docs: https://docs.composio.dev
2. Verify redirect URL in Composio dashboard matches your app
3. Check Google Cloud Console → APIs & Services → Credentials
4. Ensure all APIs are enabled (Gmail, Classroom, Calendar, Drive)

---

**TL;DR**: Go to Google Cloud Console → OAuth consent screen → Add yourself as a test user. Done! ✅
