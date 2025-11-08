"use client";

import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { useRouter } from "next/navigation";
import { Box, Container, Typography, Grid, AppBar, Toolbar, Button, IconButton } from "@mui/material";
import ChatInterface from "@/components/ChatInterface";
import CriticalPathDashboard from "@/components/CriticalPathDashboard";
import LogoutIcon from "@mui/icons-material/Logout";
import SettingsIcon from "@mui/icons-material/Settings";
import Link from "next/link";

export default function Dashboard() {
  const { user, loading, signOut } = useFirebaseAuth();
  const router = useRouter();

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
          <Button color="inherit" component={Link} href="/integrations">
            Integrations
          </Button>
          <Button color="inherit" component={Link} href="/dashboard">
            Dashboard
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
            <ChatInterface />
          </Grid>

          {/* Quick Stats Sidebar */}
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
