"use client";

import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  AppBar,
  Toolbar,
  Button,
  IconButton,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  TextField,
  InputAdornment,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import Link from "next/link";
import EmailIcon from "@mui/icons-material/Email";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import { format } from "date-fns";

interface Email {
  id: string;
  subject: string;
  from: string;
  snippet: string;
  date: string;
  body?: string;
  hasAttachments?: boolean;
  isUnread?: boolean;
}

export default function InboxPage() {
  const { user, loading: authLoading, signOut } = useFirebaseAuth();
  const router = useRouter();
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [summarizing, setSummarizing] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (user) {
      fetchEmails();
    }
  }, [user]);

  const fetchEmails = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/gmail/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          query: searchQuery || "newer_than:7d",
          maxResults: 50,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch emails");
      }

      // Transform email data
      // API returns: { success: true, emails: { messages: [...] } }
      const emailMessages = data.emails?.messages || [];
      const transformedEmails = emailMessages.map((email: any) => ({
        id: email.messageId || email.id,
        subject: email.subject || email.payload?.headers?.find((h: any) => h.name === 'Subject')?.value || "(No Subject)",
        from: email.sender || email.from || email.payload?.headers?.find((h: any) => h.name === 'From')?.value || "Unknown",
        snippet: email.preview?.body || email.snippet || email.messageText?.substring(0, 150) || "",
        date: email.messageTimestamp || email.date || new Date().toISOString(),
        body: email.messageText || email.body || email.snippet,
        hasAttachments: (email.attachmentList?.length || 0) > 0,
        isUnread: email.labelIds?.includes('UNREAD') ?? true,
      }));

      setEmails(transformedEmails);
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching emails:", err);
    } finally {
      setLoading(false);
    }
  };

  const summarizeEmail = async (email: Email) => {
    setSummarizing(true);
    setSummary(null);

    try {
      const response = await fetch("/api/gmail/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: email.subject,
          body: email.body || email.snippet,
          from: email.from,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to summarize email");
      }

      setSummary(data.summary);
    } catch (err: any) {
      console.error("Error summarizing email:", err);
      setSummary("Failed to generate summary. Please try again.");
    } finally {
      setSummarizing(false);
    }
  };

  const handleEmailClick = (email: Email) => {
    setSelectedEmail(email);
    setSummary(null);
  };

  const handleCloseDialog = () => {
    setSelectedEmail(null);
    setSummary(null);
  };

  if (authLoading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    router.push("/");
    return null;
  }

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f5f7fa" }}>
      {/* Top Navigation */}
      <AppBar position="static" sx={{ backgroundColor: "#667eea" }}>
        <Toolbar>
          <EmailIcon sx={{ mr: 2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Gmail Inbox
          </Typography>
          <Button color="inherit" component={Link} href="/dashboard">
            Dashboard
          </Button>
          <Button color="inherit" component={Link} href="/inbox">
            Inbox
          </Button>
          <Button color="inherit" component={Link} href="/integrations">
            Integrations
          </Button>
          <Button color="inherit" component={Link} href="/setup">
            Setup
          </Button>
          <IconButton color="inherit" onClick={signOut}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h4" fontWeight="bold">
            📧 Your Inbox
          </Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchEmails}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>

        {/* Search Bar */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <TextField
              fullWidth
              placeholder="Search emails... (e.g., 'from:professor' or 'subject:assignment')"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  fetchEmails();
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <Button size="small" onClick={fetchEmails}>
                      Search
                    </Button>
                  </InputAdornment>
                ),
              }}
            />
          </CardContent>
        </Card>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Email List */}
        <Card>
          <CardContent sx={{ p: 0 }}>
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                <CircularProgress />
              </Box>
            ) : emails.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 8 }}>
                <EmailIcon sx={{ fontSize: 60, color: "text.secondary", mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No emails found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Try adjusting your search or connecting your Gmail account
                </Typography>
              </Box>
            ) : (
              <List sx={{ p: 0 }}>
                {emails.map((email, index) => (
                  <Box key={email.id}>
                    {index > 0 && <Divider />}
                    <ListItemButton onClick={() => handleEmailClick(email)}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Typography
                              variant="subtitle1"
                              sx={{
                                fontWeight: email.isUnread ? 700 : 400,
                                flex: 1,
                              }}
                            >
                              {email.subject}
                            </Typography>
                            {email.hasAttachments && (
                              <AttachFileIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                            )}
                            {email.isUnread && (
                              <Chip label="NEW" size="small" color="primary" />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 0.5 }}>
                            <Typography variant="body2" color="text.secondary">
                              <strong>From:</strong> {email.from}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                              {email.snippet}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                              {format(new Date(email.date), "PPP p")}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItemButton>
                  </Box>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      </Container>

      {/* Email Detail Dialog */}
      <Dialog
        open={!!selectedEmail}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        {selectedEmail && (
          <>
            <DialogTitle>
              <Box>
                <Typography variant="h6" gutterBottom>
                  {selectedEmail.subject}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>From:</strong> {selectedEmail.from}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {format(new Date(selectedEmail.date), "PPP p")}
                </Typography>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                  {selectedEmail.body || selectedEmail.snippet}
                </Typography>
              </Box>

              {summary && (
                <Box
                  sx={{
                    mt: 3,
                    p: 2,
                    backgroundColor: "#f0f7ff",
                    borderRadius: 2,
                    border: "1px solid #2196f3",
                  }}
                >
                  <Typography variant="subtitle2" color="primary" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <AutoAwesomeIcon fontSize="small" />
                    AI Summary
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {summary}
                  </Typography>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Close</Button>
              <Button
                variant="contained"
                startIcon={summarizing ? <CircularProgress size={16} /> : <AutoAwesomeIcon />}
                onClick={() => summarizeEmail(selectedEmail)}
                disabled={summarizing}
              >
                {summarizing ? "Summarizing..." : "Summarize with AI"}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
