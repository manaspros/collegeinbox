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
} from "@mui/material";
import { formatDistanceToNow, isPast, isToday, isTomorrow } from "date-fns";
import EventIcon from "@mui/icons-material/Event";
import AssignmentIcon from "@mui/icons-material/Assignment";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";

interface Deadline {
  id: string;
  title: string;
  course: string;
  dueAt: string;
  source: "classroom" | "gmail";
  url?: string;
  type?: "assignment" | "exam" | "project" | "other";
}

export default function DeadlinesList({ userId }: { userId: string }) {
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (userId) {
      fetchDeadlines();
    }
  }, [userId]);

  const fetchDeadlines = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/deadlines?userId=${userId}`);
      if (!response.ok) throw new Error("Failed to fetch deadlines");
      const data = await response.json();
      setDeadlines(data.deadlines || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addToCalendar = async (deadline: Deadline) => {
    try {
      // This will be implemented with Composio Calendar integration
      alert(`Adding "${deadline.title}" to calendar (feature in progress)`);
    } catch (err) {
      console.error("Error adding to calendar:", err);
    }
  };

  const getDeadlineColor = (dueAt: string) => {
    const dueDate = new Date(dueAt);
    const now = new Date();
    const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (isPast(dueDate)) return "error";
    if (hoursUntilDue < 24) return "error";
    if (hoursUntilDue < 48) return "warning";
    return "success";
  };

  const getDeadlineLabel = (dueAt: string) => {
    const dueDate = new Date(dueAt);
    if (isPast(dueDate)) return "Overdue";
    if (isToday(dueDate)) return "Due Today";
    if (isTomorrow(dueDate)) return "Due Tomorrow";
    return `Due ${formatDistanceToNow(dueDate, { addSuffix: true })}`;
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
          Upcoming Deadlines
        </Typography>
        <Button size="small" onClick={fetchDeadlines}>
          Refresh
        </Button>
      </Box>

      {deadlines.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              No upcoming deadlines found. Connect your Google Classroom to see assignments.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {deadlines.map((deadline) => (
            <Card key={deadline.id} sx={{ borderLeft: 4, borderColor: `${getDeadlineColor(deadline.dueAt)}.main` }}>
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 0.5 }}>
                      {deadline.title}
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, mb: 1, flexWrap: "wrap" }}>
                      <Chip
                        label={deadline.course}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      <Chip
                        label={getDeadlineLabel(deadline.dueAt)}
                        size="small"
                        color={getDeadlineColor(deadline.dueAt)}
                      />
                      <Chip
                        label={deadline.source}
                        size="small"
                        icon={deadline.source === "classroom" ? <AssignmentIcon /> : <EventIcon />}
                      />
                    </Box>
                  </Box>
                  <Box sx={{ display: "flex", gap: 1, flexDirection: "column" }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<CalendarTodayIcon />}
                      onClick={() => addToCalendar(deadline)}
                    >
                      Add to Calendar
                    </Button>
                    {deadline.url && (
                      <Button
                        size="small"
                        variant="text"
                        href={deadline.url}
                        target="_blank"
                      >
                        View Details
                      </Button>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );
}
