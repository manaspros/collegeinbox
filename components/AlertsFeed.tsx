"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Stack,
  IconButton,
} from "@mui/material";
import { formatDistanceToNow } from "date-fns";
import WarningIcon from "@mui/icons-material/Warning";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import UpdateIcon from "@mui/icons-material/Update";
import RoomIcon from "@mui/icons-material/Room";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import CloseIcon from "@mui/icons-material/Close";

interface AlertItem {
  id: string;
  kind: "Cancelled" | "Rescheduled" | "Urgent" | "RoomChange";
  subject: string;
  date: string;
  link?: string;
  course?: string;
}

export default function AlertsFeed({ userId }: { userId: string }) {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (userId) {
      fetchAlerts();
    }
  }, [userId]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/alerts?userId=${userId}`);
      if (!response.ok) throw new Error("Failed to fetch alerts");
      const data = await response.json();
      setAlerts(data.alerts || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const dismissAlert = async (alertId: string) => {
    try {
      await fetch(`/api/alerts/${alertId}?userId=${userId}`, { method: "DELETE" });
      setAlerts(alerts.filter((a) => a.id !== alertId));
    } catch (err) {
      console.error("Error dismissing alert:", err);
    }
  };

  const getAlertIcon = (kind: string) => {
    switch (kind) {
      case "Cancelled":
        return <EventBusyIcon />;
      case "Rescheduled":
        return <UpdateIcon />;
      case "RoomChange":
        return <RoomIcon />;
      case "Urgent":
        return <WarningIcon />;
      default:
        return <NotificationsActiveIcon />;
    }
  };

  const getAlertColor = (kind: string) => {
    switch (kind) {
      case "Cancelled":
        return "error";
      case "Urgent":
        return "error";
      case "Rescheduled":
        return "warning";
      case "RoomChange":
        return "info";
      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h5" fontWeight="bold">
          Schedule Alerts
        </Typography>
        <Button size="small" onClick={fetchAlerts}>
          Refresh
        </Button>
      </Box>

      {alerts.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              No schedule alerts. You'll be notified of any cancellations, reschedules, or urgent updates.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {alerts.map((alert) => (
            <Card
              key={alert.id}
              sx={{
                borderLeft: 4,
                borderColor: `${getAlertColor(alert.kind)}.main`,
                backgroundColor: `${getAlertColor(alert.kind)}.light`,
                backgroundColor: (theme) =>
                  theme.palette.mode === "light"
                    ? `${getAlertColor(alert.kind)}.light`
                    : undefined,
              }}
            >
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                  <Box sx={{ color: `${getAlertColor(alert.kind)}.main`, mt: 0.5 }}>
                    {getAlertIcon(alert.kind)}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
                      <Chip
                        label={alert.kind}
                        size="small"
                        color={getAlertColor(alert.kind) as any}
                      />
                      {alert.course && (
                        <Chip label={alert.course} size="small" variant="outlined" />
                      )}
                      <Chip
                        label={formatDistanceToNow(new Date(alert.date), { addSuffix: true })}
                        size="small"
                      />
                    </Box>
                    <Typography variant="body1" fontWeight="medium">
                      {alert.subject}
                    </Typography>
                    {alert.link && (
                      <Button
                        size="small"
                        href={alert.link}
                        target="_blank"
                        sx={{ mt: 1 }}
                      >
                        View Details
                      </Button>
                    )}
                  </Box>
                  <IconButton
                    size="small"
                    onClick={() => dismissAlert(alert.id)}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );
}
