"use client";

import { useState, useEffect } from "react";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { useRouter } from "next/navigation";
import {
  Box,
  Container,
  Typography,
  AppBar,
  Toolbar,
  Button,
  IconButton,
  CircularProgress,
  Alert,
} from "@mui/material";
import Link from "next/link";
import LogoutIcon from "@mui/icons-material/Logout";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import CalendarHeatmap from "@/components/CalendarHeatmap";

export default function AnalyticsPage() {
  const { user, loading: authLoading, signOut } = useFirebaseAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [heatmapData, setHeatmapData] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    } else if (user) {
      fetchAnalytics();
    }
  }, [user, authLoading]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics?userId=${user?.uid}`);
      if (!response.ok) throw new Error("Failed to fetch analytics");
      const data = await response.json();
      setAnalyticsData(data.analytics);
      setHeatmapData(data.heatmap || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f5f7fa" }}>
      {/* Top Navigation */}
      <AppBar position="static" sx={{ backgroundColor: "#667eea" }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Collegiate Inbox Navigator - Analytics
          </Typography>
          <Button color="inherit" component={Link} href="/integrations">
            Integrations
          </Button>
          <Button color="inherit" component={Link} href="/dashboard" startIcon={<DashboardIcon />}>
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
          Analytics & Insights
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {analyticsData ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {/* Analytics Dashboard */}
            <AnalyticsDashboard data={analyticsData} />

            {/* Calendar Heatmap */}
            <CalendarHeatmap data={heatmapData} title="Activity Heatmap - Deadlines by Day" />
          </Box>
        ) : (
          <Alert severity="info">
            No analytics data available yet. Connect your integrations and start using the assistant to see insights.
          </Alert>
        )}
      </Container>
    </Box>
  );
}
