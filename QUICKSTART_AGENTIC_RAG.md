# Quick Start - Agentic RAG System

## 🚀 5-Minute Setup

### Prerequisites
- Gmail connected via Composio (go to `/integrations`)
- Google Calendar connected (optional, for calendar sync)
- Firebase project configured

---

## Step 1: Initial Email Sync

When a user logs in for the first time, trigger initial sync:

```typescript
// In your login handler or dashboard mount
const response = await fetch("/api/sync-emails", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    userId: user.uid,
    maxEmails: 100,        // First sync: get more history
    query: "newer_than:30d" // Last 30 days
  })
});

const result = await response.json();
console.log("Sync complete:", result.stats);
// Output: { fetched: 100, processed: 100, failed: 0 }
```

**What happens:**
1. Fetches 100 recent emails from Gmail
2. Converts each to vector embedding
3. AI agents extract: deadlines, documents, alerts
4. Everything stored in Firestore

**Time:** ~60-120 seconds (one-time)

---

## Step 2: Load Dashboard Data

Now dashboard loads **instantly** from Firestore:

```typescript
// In CriticalPathDashboard component
const response = await fetch(`/api/dashboard/data?userId=${user.uid}`);
const { data } = await response.json();

setDeadlines(data.deadlines);           // Array of deadline objects
setDocuments(data.documents);           // Array of document objects
setScheduleChanges(data.scheduleChanges); // Array of alert objects
```

**Performance:**
- ⚡ **50-200ms** response time
- 💰 **$0** API cost (Firestore read)
- 📊 Real-time updates

---

## Step 3: Display on Dashboard

Data is already structured and ready to display:

```typescript
{
  deadlines: [
    {
      id: "email123_deadline_0",
      title: "CS 229 Assignment 3",
      course: "CS 229",
      dueDate: "2025-11-15T23:59:00Z",
      type: "assignment",
      priority: "high",
      addedToCalendar: false
    }
  ],
  documents: [
    {
      id: "email456_doc_0",
      filename: "Lecture_10_Neural_Networks.pdf",
      course: "CS 229",
      type: "pdf",
      category: "lecture",
      url: "https://..."
    }
  ],
  scheduleChanges: [
    {
      id: "email789_alert_cancelled",
      type: "cancelled",
      course: "PHYS 101",
      message: "Class Cancelled - Monday",
      date: "2025-10-25"
    }
  ]
}
```

**UI Features:**
- Countdown timers for deadlines
- Priority color coding (high/medium/low)
- Course grouping for documents
- Alert badges

---

## Step 4: One-Click Calendar Sync

Add deadline to Google Calendar with reminders:

```typescript
const response = await fetch("/api/calendar/add-event", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    userId: user.uid,
    event: {
      id: deadline.id,  // Marks as synced in Firestore
      title: deadline.title,
      dueDate: deadline.dueDate,
      description: deadline.description
    },
    addReminders: true,
    reminderMinutes: [60, 1440] // 1 hour + 1 day before
  })
});

// Automatically updates deadline.addedToCalendar = true
```

**Result:**
- ✅ Event added to Google Calendar
- ✅ Popup reminders set (1 hour + 1 day)
- ✅ Deadline marked with checkmark in UI
- ✅ Prevents duplicate additions

---

## Step 5: Incremental Sync (Ongoing)

After initial sync, fetch only new emails:

```typescript
// Run this every 1-6 hours (cron job or manual button)
await fetch("/api/sync-emails", {
  method: "POST",
  body: JSON.stringify({
    userId: user.uid,
    maxEmails: 20,          // Fewer emails for incremental
    query: "newer_than:1d"   // Only last 24 hours
  })
});
```

**Scheduled Options:**

**Option A: Manual Button**
```tsx
<Button onClick={syncEmails}>Sync New Emails</Button>
```

**Option B: Vercel Cron Job**
```json
{
  "crons": [{
    "path": "/api/cron/sync-emails",
    "schedule": "0 */6 * * *"  // Every 6 hours
  }]
}
```

**Option C: Firebase Cloud Function**
```typescript
export const scheduledSync = functions.pubsub
  .schedule('every 6 hours')
  .onRun(async () => {
    const users = await getActiveUsers();
    for (const user of users) {
      await syncUserEmails(user.uid);
    }
  });
```

---

## 🎯 User Flow Summary

```
┌─────────────────────────────────────────────────────────────┐
│ 1. USER LOGS IN                                            │
│    ↓                                                        │
│    Trigger initial sync (30 days, 100 emails)             │
│    Wait 60-120 seconds (one-time setup)                   │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. DASHBOARD LOADS                                         │
│    ↓                                                        │
│    Fetch from Firestore (50-200ms)                        │
│    Display: Deadlines, Documents, Alerts                  │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. USER INTERACTS                                          │
│    ↓                                                        │
│    Click "Add to Calendar" → Event + Reminders            │
│    Click "Sync Emails" → Fetch latest (1-6 hours old)    │
│    Browse documents by course                              │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. ONGOING SYNC (Automated)                                │
│    ↓                                                        │
│    Cron job runs every 6 hours                            │
│    Fetches only new emails (incremental)                  │
│    Updates dashboard automatically                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 What Gets Extracted

### Deadlines
- **Assignment due dates** → "Submit by Friday 11:59 PM"
- **Exam dates** → "Midterm on Oct 25, 2pm"
- **Project submissions** → "Final project due Dec 15"

### Documents
- **PDFs** → Lecture slides, syllabus, papers
- **DOCX** → Assignment instructions, study guides
- **PPT** → Presentation slides
- **XLSX** → Data sets, grade sheets

### Alerts
- **Cancelled classes** → "Class cancelled tomorrow"
- **Room changes** → "Moved to Building A, Room 301"
- **Rescheduled events** → "Office hours moved to Wednesday"
- **Urgent notices** → "Important: Exam format changed"

### Reminders
- **Time-based** → "Meeting tomorrow at 3pm"
- **Event invitations** → "Study group Saturday 10am"
- **Office hours** → "TA office hours today 2-4pm"

---

## 🔍 Advanced: Semantic Search (Future)

```typescript
// Search emails by meaning, not just keywords
const results = await searchEmails(
  user.uid,
  "machine learning assignment neural networks",
  10  // top 10 results
);

// Returns most relevant emails based on embedding similarity
```

**Use Cases:**
- "Find emails about office hours with Professor Smith"
- "Show messages related to final exam schedule"
- "Search lecture notes on quantum mechanics"

---

## 🎛️ Configuration

### Sync Frequency

**Conservative (lower cost):**
```typescript
query: "newer_than:7d"
maxEmails: 20
schedule: "0 */12 * * *"  // Every 12 hours
```

**Aggressive (more current):**
```typescript
query: "newer_than:1d"
maxEmails: 50
schedule: "0 */3 * * *"  // Every 3 hours
```

### Reminder Settings

**Default:**
```typescript
reminderMinutes: [60, 1440]  // 1 hour + 1 day before
```

**Custom:**
```typescript
reminderMinutes: [30, 120, 1440]  // 30 min, 2 hours, 1 day
```

---

## 🐛 Troubleshooting

### "No data showing"
**Fix:** Click "Sync Emails" button, wait 30-60 seconds, refresh

### "Sync failed"
**Fix:** Ensure Gmail is connected at `/integrations`

### "Calendar sync not working"
**Fix:** Connect Google Calendar at `/integrations`

### "Old data showing"
**Fix:** Click "Sync Emails" to fetch latest emails

---

## 📈 Expected Results

After first sync (100 emails):
- **~5-15 deadlines** extracted
- **~10-30 documents** cataloged
- **~2-8 alerts** detected
- **All data searchable** via semantic search

**Dashboard load time:**
- Before: 5-10 seconds (API calls)
- After: **50-200ms** (Firestore read)

**Cost savings:**
- Before: ~$0.05 per dashboard load
- After: **~$0.0001** per dashboard load
- **500x cheaper!** 🎉

---

## 🚀 Next Steps

1. **Test the system:**
   - Connect Gmail
   - Click "Sync Emails"
   - Wait for processing
   - Refresh dashboard

2. **Set up scheduled sync:**
   - Add Vercel cron job
   - OR use Firebase Cloud Functions
   - Run every 3-6 hours

3. **Enable calendar sync:**
   - Connect Google Calendar
   - Add deadlines with one click
   - Get automatic reminders

4. **Monitor performance:**
   - Check Firestore usage
   - Monitor API costs
   - Optimize sync frequency

---

## 📚 Full Documentation

For detailed architecture and API reference, see:
- `AGENTIC_RAG_GUIDE.md` - Complete system documentation
- `CLAUDE.md` - Project overview and patterns
- `lib/agentic-rag.ts` - Implementation code

**Ready to revolutionize your email workflow!** 🎓✨
