"use client";

import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { useState, useEffect } from "react";
import {
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  Chip,
} from "@mui/material";
import EmailIcon from "@mui/icons-material/Email";
import SchoolIcon from "@mui/icons-material/School";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import FolderIcon from "@mui/icons-material/Folder";
import TelegramIcon from "@mui/icons-material/Telegram";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

interface Integration {
  name: string;
  connected: boolean;
  connection?: any;
}

const integrationInfo = [
  {
    name: "gmail",
    label: "Gmail",
    icon: EmailIcon,
    description: "Access your university emails and attachments",
    color: "#EA4335",
  },
  {
    name: "googleclassroom",
    label: "Google Classroom",
    icon: SchoolIcon,
    description: "View courses, assignments, and grades",
    color: "#0F9D58",
  },
  {
    name: "googlecalendar",
    label: "Google Calendar",
    icon: CalendarTodayIcon,
    description: "Sync deadlines and events to your calendar",
    color: "#4285F4",
  },
  {
    name: "googledrive",
    label: "Google Drive",
    icon: FolderIcon,
    description: "Search and access course files and documents",
    color: "#FBBC04",
  },
  {
    name: "telegram",
    label: "Telegram",
    icon: TelegramIcon,
    description: "Get notifications on Telegram",
    color: "#0088cc",
  },
];

export default function IntegrationManager() {
  const { user } = useFirebaseAuth();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectingApp, setConnectingApp] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchIntegrations();
    }
  }, [user]);

  async function fetchIntegrations() {
    if (!user) return;

    try {
      setLoading(true);
      const res = await fetch("/api/integrations/list", {
        headers: { "user-id": user.uid },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch integrations");
      }

      const data = await res.json();
      console.log("Received integrations data:", data);
      setIntegrations(data.integrations || []);
    } catch (error) {
      console.error("Error fetching integrations:", error);
    } finally {
      setLoading(false);
    }
  }

  async function connectIntegration(appName: string) {
    if (!user) return;

    try {
      setConnectingApp(appName);
      const res = await fetch("/api/integrations/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firebaseUid: user.uid,
          app: appName,
          redirectUrl: `${window.location.origin}/integrations`,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to initiate connection");
      }

      const { connectionUrl } = await res.json();

      // Redirect to Composio OAuth page
      window.location.href = connectionUrl;
    } catch (error) {
      console.error("Connection error:", error);
      setConnectingApp(null);
    }
  }

  async function disconnectIntegration(appName: string, connectionId: string) {
    if (!user) return;

    try {
      const res = await fetch("/api/integrations/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          connectionId,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to disconnect");
      }

      // Refresh integrations
      await fetchIntegrations();
    } catch (error) {
      console.error("Disconnect error:", error);
    }
  }

  if (!user) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography variant="h6" color="text.secondary">
          Please sign in to manage integrations
        </Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Connect Your Apps
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Connect your Google accounts and messaging apps to enable AI-powered features
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {integrationInfo.map((info) => {
          const integration = integrations.find((i) => i.name === info.name);
          const isConnected = integration?.connected || false;
          const IconComponent = info.icon;
          const isConnecting = connectingApp === info.name;

          return (
            <Grid item xs={12} sm={6} md={4} key={info.name}>
              <Card
                elevation={2}
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                  border: isConnected ? `2px solid ${info.color}` : "none",
                }}
              >
                {isConnected && (
                  <Chip
                    icon={<CheckCircleIcon />}
                    label="Connected"
                    color="success"
                    size="small"
                    sx={{ position: "absolute", top: 8, right: 8 }}
                  />
                )}

                <CardContent sx={{ flex: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: "50%",
                        backgroundColor: `${info.color}15`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <IconComponent sx={{ fontSize: 28, color: info.color }} />
                    </Box>
                    <Typography variant="h6">{info.label}</Typography>
                  </Box>

                  <Typography variant="body2" color="text.secondary">
                    {info.description}
                  </Typography>
                </CardContent>

                <CardActions>
                  {isConnected ? (
                    <Button
                      fullWidth
                      variant="outlined"
                      color="error"
                      onClick={() => {
                        const connId = integration?.connection?.id ||
                                      integration?.connection?.connectionId ||
                                      integration?.connection?.connectedAccountId;
                        if (connId) {
                          disconnectIntegration(info.name, connId);
                        } else {
                          console.error("No connection ID found for:", info.name, integration);
                        }
                      }}
                      disabled={isConnecting || !integration?.connection}
                    >
                      Disconnect
                    </Button>
                  ) : (
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => connectIntegration(info.name)}
                      disabled={isConnecting}
                      sx={{
                        backgroundColor: info.color,
                        "&:hover": {
                          backgroundColor: info.color,
                          opacity: 0.9,
                        },
                      }}
                    >
                      {isConnecting ? (
                        <>
                          <CircularProgress size={16} sx={{ mr: 1 }} color="inherit" />
                          Connecting...
                        </>
                      ) : (
                        "Connect"
                      )}
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}
