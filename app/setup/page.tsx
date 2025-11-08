"use client";

import { useState } from "react";
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Link as MuiLink,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import LaunchIcon from "@mui/icons-material/Launch";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";

export default function SetupPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [setupResults, setSetupResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runAutoSetup = async () => {
    setLoading(true);
    setSetupResults(null);

    try {
      const response = await fetch("/api/setup/auth-configs", {
        method: "POST",
      });

      const data = await response.json();
      setSetupResults(data);

      if (data.success) {
        setActiveStep(2); // Move to final step
      }
    } catch (error: any) {
      setSetupResults({
        success: false,
        error: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      label: "Create Composio Account",
      description: (
        <Box>
          <Typography variant="body2" paragraph>
            First, you need a Composio account to manage integrations.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<LaunchIcon />}
            href="https://app.composio.dev/signup"
            target="_blank"
            sx={{ mb: 2 }}
          >
            Sign Up for Composio
          </Button>
          <Typography variant="caption" display="block" color="text.secondary">
            Already have an account? <MuiLink href="https://app.composio.dev/login" target="_blank">Sign In</MuiLink>
          </Typography>
        </Box>
      ),
    },
    {
      label: "Setup Auth Configs",
      description: (
        <Box>
          <Typography variant="body2" paragraph>
            Auth configs are required to connect Gmail, Google Classroom, Calendar, and Drive.
          </Typography>

          <Alert severity="info" sx={{ mb: 2 }}>
            You have 2 options: Automatic setup (recommended) or Manual setup
          </Alert>

          {/* Option 1: Automatic */}
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Option 1: Automatic Setup (Recommended)
              </Typography>
              <Typography variant="body2" paragraph>
                Click the button below to automatically create auth configs for all required apps.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={loading ? <CircularProgress size={16} /> : <PlayArrowIcon />}
                onClick={runAutoSetup}
                disabled={loading}
              >
                {loading ? "Setting up..." : "Run Auto Setup"}
              </Button>

              {setupResults && (
                <Box sx={{ mt: 2 }}>
                  {setupResults.success ? (
                    <Alert severity="success">
                      {setupResults.message}
                    </Alert>
                  ) : (
                    <Alert severity="error">
                      {setupResults.error || setupResults.message}
                    </Alert>
                  )}

                  {setupResults.results && (
                    <List dense sx={{ mt: 1 }}>
                      {setupResults.results.map((result: any) => (
                        <ListItem key={result.toolkit}>
                          <ListItemIcon>
                            {result.status === "created" || result.status === "exists" ? (
                              <CheckCircleIcon color="success" />
                            ) : (
                              <ErrorIcon color="error" />
                            )}
                          </ListItemIcon>
                          <ListItemText
                            primary={result.toolkit}
                            secondary={result.message}
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Option 2: Manual */}
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Option 2: Manual Setup
              </Typography>
              <Typography variant="body2" paragraph>
                If automatic setup doesn't work, create auth configs manually:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="1. Go to Composio Dashboard"
                    secondary={
                      <MuiLink href="https://app.composio.dev/settings/auth-configs" target="_blank">
                        https://app.composio.dev/settings/auth-configs
                      </MuiLink>
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemText primary="2. Click 'Add Auth Config'" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="3. Select 'Gmail' and click 'Use Composio Managed Auth'" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="4. Click 'Save'" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="5. Repeat for: Google Classroom, Google Calendar, Google Drive" />
                </ListItem>
              </List>
              <Button
                variant="outlined"
                startIcon={<LaunchIcon />}
                href="https://app.composio.dev/settings/auth-configs"
                target="_blank"
                sx={{ mt: 1 }}
              >
                Open Composio Dashboard
              </Button>
            </CardContent>
          </Card>
        </Box>
      ),
    },
    {
      label: "Connect Your Apps",
      description: (
        <Box>
          <Typography variant="body2" paragraph>
            Now you're ready to connect your Google accounts!
          </Typography>
          <Alert severity="success" sx={{ mb: 2 }}>
            Auth configs are set up. You can now connect your apps.
          </Alert>
          <Button
            variant="contained"
            color="primary"
            href="/integrations"
          >
            Go to Integrations
          </Button>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f5f7fa", py: 4 }}>
      <Container maxWidth="md">
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom fontWeight="bold">
            🚀 Setup Wizard
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Let's get your Collegiate Inbox Navigator set up in 3 easy steps!
          </Typography>

          <Stepper activeStep={activeStep} orientation="vertical" sx={{ mt: 4 }}>
            {steps.map((step, index) => (
              <Step key={step.label}>
                <StepLabel>{step.label}</StepLabel>
                <StepContent>
                  {step.description}
                  <Box sx={{ mb: 2, mt: 2 }}>
                    <Button
                      variant="contained"
                      onClick={() => setActiveStep(index + 1)}
                      sx={{ mr: 1 }}
                    >
                      {index === steps.length - 1 ? "Finish" : "Continue"}
                    </Button>
                    {index > 0 && (
                      <Button onClick={() => setActiveStep(index - 1)}>
                        Back
                      </Button>
                    )}
                  </Box>
                </StepContent>
              </Step>
            ))}
          </Stepper>

          {activeStep === steps.length && (
            <Paper square elevation={0} sx={{ p: 3, mt: 3, backgroundColor: "#f0f7ff" }}>
              <Typography variant="h6" gutterBottom>
                ✅ Setup Complete!
              </Typography>
              <Typography variant="body2" paragraph>
                Your Collegiate Inbox Navigator is ready to use. Start by connecting your Gmail and other Google apps.
              </Typography>
              <Button variant="contained" href="/integrations">
                Go to Integrations
              </Button>
            </Paper>
          )}
        </Paper>
      </Container>
    </Box>
  );
}
