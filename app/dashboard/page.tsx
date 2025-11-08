"use client";

import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { useRouter } from "next/navigation";
import { Box, Container, Typography, Grid, AppBar, Toolbar, Button, IconButton, Tab, Tabs } from "@mui/material";
import { useState } from "react";
import ChatInterface from "@/components/ChatInterface";
import CriticalPathDashboard from "@/components/CriticalPathDashboard";
import LogoutIcon from "@mui/icons-material/Logout";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import Link from "next/link";

export default function Dashboard() {
  const { user, loading, signOut } = useFirebaseAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);

  // Handler for voice commands
  const handleVoiceCommand = (command: string) => {
    // Switch to AI Assistant tab and pass the command
    setActiveTab(0);
    // You could also pass the command to ChatInterface via context or props
    console.log("Voice command:", command);
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Typography>Loading...</Typography>
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
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Collegiate Inbox Navigator
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
          <Button color="inherit" component={Link} href="/analytics" startIcon={<AnalyticsIcon />}>
            Analytics
          </Button>
          <IconButton color="inherit" onClick={signOut}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold" sx={{ mb: 3 }}>
          Welcome back, {user.displayName || user.email}!
        </Typography>

        <Grid container spacing={3}>
          {/* Critical Path Dashboard */}
          <Grid item xs={12}>
            <CriticalPathDashboard />
          </Grid>

          {/* AI Chat Interface */}
          <Grid item xs={12} lg={8}>
            {/* Tabs for different views */}
            <Box sx={{ backgroundColor: "white", borderRadius: 2, boxShadow: 1, mb: 3 }}>
              <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
                <Tab label="AI Assistant" />
                <Tab label="Deadlines" />
                <Tab label="Documents" />
                <Tab label="Alerts" />
                <Tab label="Voice Assistant" />
              </Tabs>
            </Box>

            {/* Tab Content */}
            <Box sx={{ backgroundColor: "white", p: 3, borderRadius: 2, boxShadow: 1 }}>
              {activeTab === 0 && <ChatInterface />}
              {activeTab === 1 && user && <DeadlinesList userId={user.uid} />}
              {activeTab === 2 && user && <DocumentRepository userId={user.uid} />}
              {activeTab === 3 && user && <AlertsFeed userId={user.uid} />}
              {activeTab === 4 && user && <VoiceAssistant userId={user.uid} onCommand={handleVoiceCommand} />}
            </Box>
          </Grid>

          {/* Right Column - Quick Stats Sidebar */}
          <Grid item xs={12} lg={4}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {/* Quick Actions */}
              <Box sx={{ backgroundColor: "white", p: 3, borderRadius: 2, boxShadow: 1 }}>
                <Typography variant="h6" gutterBottom>
                  Quick Actions
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 2 }}>
                  <Button variant="outlined" fullWidth component={Link} href="/integrations">
                    Connect Apps
                  </Button>
                  <Button variant="outlined" fullWidth component={Link} href="/inbox">
                    View Gmail Inbox
                  </Button>
                  <Button variant="outlined" fullWidth disabled>
                    View Analytics (Coming Soon)
                  </Button>
                  <Button variant="outlined" fullWidth disabled>
                    Settings (Coming Soon)
                  </Button>
                </Box>
              </Box>

              {/* Tips */}
              <Box sx={{ backgroundColor: "white", p: 3, borderRadius: 2, boxShadow: 1 }}>
                <Typography variant="h6" gutterBottom>
                  Try asking:
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1, fontStyle: "italic" }}>
                    • "Show me all deadlines this week"
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, fontStyle: "italic" }}>
                    • "Find PDFs from my ML course"
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, fontStyle: "italic" }}>
                    • "What's due this weekend?"
                  </Typography>
                  <Typography variant="body2" sx={{ fontStyle: "italic" }}>
                    • "Search for professor emails"
                  </Typography>
                </Box>
              </Box>

              {/* Connection Status */}
              <Box sx={{ backgroundColor: "white", p: 3, borderRadius: 2, boxShadow: 1 }}>
                <Typography variant="h6" gutterBottom>
                  Connection Status
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Visit the <Link href="/integrations" style={{ color: "#667eea" }}>Integrations page</Link> to connect your Gmail, Google Classroom, and Calendar accounts.
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
