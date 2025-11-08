"use client";

import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Stack,
} from "@mui/material";
import SchoolIcon from "@mui/icons-material/School";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import EmailIcon from "@mui/icons-material/Email";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";

export default function Home() {
  const { user, loading, signInWithGoogle } = useFirebaseAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !loading) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  if (user) {
    return null; // Will redirect to dashboard
  }

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f5f7fa" }}>
      {/* Hero Section */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          py: 12,
          textAlign: "center",
        }}
      >
        <Container maxWidth="lg">
          <SchoolIcon sx={{ fontSize: 80, mb: 2 }} />
          <Typography variant="h2" gutterBottom fontWeight="bold">
            Collegiate Inbox Navigator
          </Typography>
          <Typography variant="h5" sx={{ mb: 4, opacity: 0.9 }}>
            Your AI-Powered Academic Assistant
          </Typography>
          <Typography variant="body1" sx={{ mb: 4, maxWidth: 600, mx: "auto" }}>
            Never miss a deadline, assignment, or important email again. Let AI organize
            your academic life across Gmail, Google Classroom, and Calendar.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={signInWithGoogle}
            sx={{
              backgroundColor: "white",
              color: "#667eea",
              px: 4,
              py: 1.5,
              fontSize: "1.1rem",
              "&:hover": { backgroundColor: "#f0f0f0" },
            }}
          >
            Sign In with Google
          </Button>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h4" align="center" gutterBottom fontWeight="bold" sx={{ mb: 6 }}>
          Features
        </Typography>

        <Box sx={{ display: "flex", gap: 4, flexDirection: { xs: "column", md: "row" } }}>
          <Box sx={{ flex: 1 }}>
            <Card sx={{ height: "100%", textAlign: "center" }}>
              <CardContent>
                <SmartToyIcon sx={{ fontSize: 60, color: "#667eea", mb: 2 }} />
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Natural Language Chat
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Ask questions like "Show me all deadlines this week" and get instant
                  answers powered by Google Gemini AI.
                </Typography>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ flex: 1 }}>
            <Card sx={{ height: "100%", textAlign: "center" }}>
              <CardContent>
                <EmailIcon sx={{ fontSize: 60, color: "#667eea", mb: 2 }} />
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Smart Email Organization
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  AI categorizes your university emails, extracts deadlines, and
                  highlights important announcements automatically.
                </Typography>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ flex: 1 }}>
            <Card sx={{ height: "100%", textAlign: "center" }}>
              <CardContent>
                <CalendarTodayIcon sx={{ fontSize: 60, color: "#667eea", mb: 2 }} />
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Deadline Tracking
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Automatically sync assignments and exams from Google Classroom to your
                  calendar with countdown timers.
                </Typography>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ flex: 1 }}>
            <Card sx={{ height: "100%", textAlign: "center" }}>
              <CardContent>
                <TrendingUpIcon sx={{ fontSize: 60, color: "#667eea", mb: 2 }} />
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Analytics Dashboard
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Visualize your workload with charts, heatmaps, and insights about your
                  academic activity.
                </Typography>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ flex: 1 }}>
            <Card sx={{ height: "100%", textAlign: "center" }}>
              <CardContent>
                <NotificationsActiveIcon sx={{ fontSize: 60, color: "#667eea", mb: 2 }} />
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Smart Notifications
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Get alerts for schedule changes, exam postponements, and urgent notices
                  via browser or WhatsApp.
                </Typography>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ flex: 1 }}>
            <Card sx={{ height: "100%", textAlign: "center" }}>
              <CardContent>
                <SchoolIcon sx={{ fontSize: 60, color: "#667eea", mb: 2 }} />
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Document Repository
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  All your course PDFs, lecture slides, and materials organized by course
                  in one searchable place.
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Container>

      {/* CTA Section */}
      <Box
        sx={{
          backgroundColor: "#667eea",
          color: "white",
          py: 8,
          textAlign: "center",
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h4" gutterBottom fontWeight="bold">
            Ready to Get Organized?
          </Typography>
          <Typography variant="body1" sx={{ mb: 4 }}>
            Join students who are using AI to stay on top of their academic life.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={signInWithGoogle}
            sx={{
              backgroundColor: "white",
              color: "#667eea",
              px: 4,
              py: 1.5,
              fontSize: "1.1rem",
              "&:hover": { backgroundColor: "#f0f0f0" },
            }}
          >
            Get Started Free
          </Button>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ backgroundColor: "#2d3748", color: "white", py: 4 }}>
        <Container maxWidth="lg">
          <Typography variant="body2" align="center">
            Built with Next.js, Firebase, Composio, and Google Gemini AI
          </Typography>
          <Typography variant="caption" align="center" display="block" sx={{ mt: 1 }}>
            Hackathon Challenge 5: The Collegiate Inbox Navigator
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
