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
  kind: "cancelled" | "rescheduled" | "urgent" | "room_change";
  subject: string;
  date: string;
  link?: string;
  course?: string;
  emailId?: string;
  from?: string;
  createdAt?: any;
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
      const { collection, query, orderBy, getDocs } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase");

      const q = query(
        collection(db, "cache_alerts", userId, "items"),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(q);
      const alertsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as AlertItem[];

      setAlerts(alertsList);
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching alerts:", err);
    } finally {
      setLoading(false);
    }
  };

  const dismissAlert = async (alertId: string) => {
    try {
      const { doc, deleteDoc } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase");

      await deleteDoc(doc(db, "cache_alerts", userId, "items", alertId));
      setAlerts(alerts.filter((a) => a.id !== alertId));
    } catch (err) {
      console.error("Error dismissing alert:", err);
    }
  };

  const getAlertIcon = (kind: string) => {
    switch (kind.toLowerCase()) {
      case "cancelled":
        return <EventBusyIcon />;
      case "rescheduled":
        return <UpdateIcon />;
      case "room_change":
        return <RoomIcon />;
      case "urgent":
        return <WarningIcon />;
      default:
        return <NotificationsActiveIcon />;
    }
  };

  const getAlertColor = (kind: string) => {
    switch (kind.toLowerCase()) {
      case "cancelled":
        return "error";
      case "urgent":
        return "error";
      case "rescheduled":
        return "warning";
      case "room_change":
        return "info";
      default:
        return "default";
    }
  };

  const formatAlertKind = (kind: string) => {
    switch (kind) {
      case "cancelled":
        return "Cancelled";
      case "rescheduled":
        return "Rescheduled";
      case "room_change":
        return "Room Change";
      case "urgent":
        return "Urgent";
      default:
        return kind;
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
                    <Box sx={{ display: "flex", gap: 1, mb: 1, flexWrap: "wrap" }}>
                      <Chip
                        label={formatAlertKind(alert.kind)}
                        size="small"
                        color={getAlertColor(alert.kind) as any}
                      />
                      {alert.course && (
                        <Chip label={alert.course} size="small" variant="outlined" />
                      )}
                      {alert.createdAt && (
                        <Chip
                          label={formatDistanceToNow(alert.createdAt.toDate ? alert.createdAt.toDate() : new Date(alert.createdAt), { addSuffix: true })}
                          size="small"
                        />
                      )}
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
