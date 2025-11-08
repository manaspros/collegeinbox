"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  IconButton,
  Divider,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tooltip,
  Tab,
  Tabs,
} from "@mui/material";
import {
  Assignment as AssignmentIcon,
  CalendarToday as CalendarIcon,
  Description as DocumentIcon,
  Warning as WarningIcon,
  Add as AddIcon,
  Download as DownloadIcon,
  School as SchoolIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { formatDistanceToNow, format, isPast, differenceInDays } from "date-fns";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";

interface Deadline {
  id: string;
  title: string;
  course: string;
  dueDate: string;
  description: string;
  type: "assignment" | "exam" | "project" | "submission";
  priority: "high" | "medium" | "low";
}

interface ScheduleChange {
  id: string;
  type: "cancelled" | "rescheduled" | "room_change" | "urgent";
  course: string;
  message: string;
  date: string;
  details: string;
}

interface Document {
  id: string;
  filename: string;
  course: string;
  type: "pdf" | "docx" | "ppt";
  category: "assignment" | "lecture" | "notes" | "syllabus";
  url?: string;
}

interface AnalysisData {
  deadlines: Deadline[];
  scheduleChanges: ScheduleChange[];
  documents: Document[];
  categorization: Record<string, any>;
}

export default function CriticalPathDashboard() {
  const { user } = useFirebaseAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysisData, setAnalysisData] = useState<AnalysisData>({
    deadlines: [],
    scheduleChanges: [],
    documents: [],
    categorization: {},
  });
  const [selectedTab, setSelectedTab] = useState(0);
  const [syncingEvent, setSyncingEvent] = useState<string | null>(null);

  // Fetch and analyze emails
  const fetchAnalysis = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/gmail/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid, maxEmails: 100 }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze emails");
      }

      setAnalysisData(data.analysis);
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching analysis:", err);
    } finally {
      setLoading(false);
    }
  };

  // Sync deadline to calendar
  const syncToCalendar = async (deadline: Deadline) => {
    if (!user) return;

    setSyncingEvent(deadline.id);

    try {
      const response = await fetch("/api/calendar/add-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          event: {
            title: `${deadline.course}: ${deadline.title}`,
            description: deadline.description,
            startDate: deadline.dueDate,
            endDate: deadline.dueDate,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to sync to calendar");
      }

      alert("✅ Event added to your calendar!");
    } catch (err: any) {
      alert(`❌ Error: ${err.message}`);
      console.error("Error syncing to calendar:", err);
    } finally {
      setSyncingEvent(null);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAnalysis();
    }
  }, [user]);

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "error";
      case "medium": return "warning";
      case "low": return "success";
      default: return "default";
    }
  };

  // Get countdown color based on days remaining
  const getCountdownColor = (dueDate: string) => {
    const days = differenceInDays(new Date(dueDate), new Date());
    if (days < 0) return "#f44336"; // Red - overdue
    if (days <= 2) return "#ff9800"; // Orange - urgent
    if (days <= 7) return "#ffc107"; // Yellow - soon
    return "#4caf50"; // Green - plenty of time
  };

  // Sort deadlines by due date
  const sortedDeadlines = [...analysisData.deadlines].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );

  // Group documents by course
  const documentsByCourse = analysisData.documents.reduce((acc, doc) => {
    if (!acc[doc.course]) acc[doc.course] = [];
    acc[doc.course].push(doc);
    return acc;
  }, {} as Record<string, Document[]>);

  if (!user) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" color="text.secondary" textAlign="center">
            Please sign in to view your Critical Path Dashboard
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          📊 Critical Path Dashboard
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchAnalysis}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {/* Upcoming Deadlines */}
          <Grid item xs={12} lg={6}>
            <Card sx={{ height: "100%" }}>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <AssignmentIcon sx={{ mr: 1, color: "#1976d2" }} />
                  <Typography variant="h6" fontWeight="bold">
                    Upcoming Deadlines
                  </Typography>
                  <Chip
                    label={sortedDeadlines.length}
                    size="small"
                    color="primary"
                    sx={{ ml: 1 }}
                  />
                </Box>

                <Divider sx={{ mb: 2 }} />

                {sortedDeadlines.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
                    No upcoming deadlines found
                  </Typography>
                ) : (
                  <List>
                    {sortedDeadlines.slice(0, 10).map((deadline) => {
                      const dueDate = new Date(deadline.dueDate);
                      const daysRemaining = differenceInDays(dueDate, new Date());
                      const isOverdue = isPast(dueDate);

                      return (
                        <ListItem
                          key={deadline.id}
                          sx={{
                            mb: 2,
                            border: "1px solid #e0e0e0",
                            borderRadius: 2,
                            backgroundColor: isOverdue ? "#ffebee" : "#fff",
                          }}
                        >
                          <ListItemIcon>
                            <Box
                              sx={{
                                width: 60,
                                height: 60,
                                borderRadius: "50%",
                                backgroundColor: getCountdownColor(deadline.dueDate),
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "white",
                                fontWeight: "bold",
                              }}
                            >
                              <Typography variant="h6">
                                {isOverdue ? "!" : Math.abs(daysRemaining)}
                              </Typography>
                              <Typography variant="caption" sx={{ fontSize: "0.6rem" }}>
                                {isOverdue ? "LATE" : "days"}
                              </Typography>
                            </Box>
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box>
                                <Typography variant="subtitle1" fontWeight="bold">
                                  {deadline.title}
                                </Typography>
                                <Chip
                                  label={deadline.course}
                                  size="small"
                                  icon={<SchoolIcon />}
                                  sx={{ mt: 0.5, mr: 0.5 }}
                                />
                                <Chip
                                  label={deadline.type}
                                  size="small"
                                  color={getPriorityColor(deadline.priority) as any}
                                  sx={{ mt: 0.5 }}
                                />
                              </Box>
                            }
                            secondary={
                              <Box sx={{ mt: 1 }}>
                                <Typography variant="body2" color="text.secondary">
                                  {deadline.description}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Due: {format(dueDate, "PPP p")} ({formatDistanceToNow(dueDate, { addSuffix: true })})
                                </Typography>
                              </Box>
                            }
                          />
                          <Tooltip title="Add to Calendar">
                            <IconButton
                              color="primary"
                              onClick={() => syncToCalendar(deadline)}
                              disabled={syncingEvent === deadline.id}
                            >
                              {syncingEvent === deadline.id ? (
                                <CircularProgress size={24} />
                              ) : (
                                <AddIcon />
                              )}
                            </IconButton>
                          </Tooltip>
                        </ListItem>
                      );
                    })}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Schedule Changes & Alerts */}
          <Grid item xs={12} lg={6}>
            <Card sx={{ height: "100%", maxHeight: 600, overflow: "auto" }}>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <WarningIcon sx={{ mr: 1, color: "#ff9800" }} />
                  <Typography variant="h6" fontWeight="bold">
                    Schedule Changes & Alerts
                  </Typography>
                  <Chip
                    label={analysisData.scheduleChanges.length}
                    size="small"
                    color="warning"
                    sx={{ ml: 1 }}
                  />
                </Box>

                <Divider sx={{ mb: 2 }} />

                {analysisData.scheduleChanges.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
                    No schedule changes or alerts
                  </Typography>
                ) : (
                  <List>
                    {analysisData.scheduleChanges.map((change) => (
                      <ListItem
                        key={change.id}
                        sx={{
                          mb: 2,
                          border: "1px solid #ff9800",
                          borderRadius: 2,
                          backgroundColor: "#fff3e0",
                        }}
                      >
                        <ListItemIcon>
                          <WarningIcon color="warning" />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box>
                              <Typography variant="subtitle1" fontWeight="bold">
                                {change.type.replace("_", " ").toUpperCase()}
                              </Typography>
                              <Chip
                                label={change.course}
                                size="small"
                                icon={<SchoolIcon />}
                                sx={{ mt: 0.5 }}
                              />
                            </Box>
                          }
                          secondary={
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="body2">
                                {change.message}
                              </Typography>
                              {change.details && (
                                <Typography variant="caption" color="text.secondary">
                                  {change.details}
                                </Typography>
                              )}
                              <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                                {format(new Date(change.date), "PPP")}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Key Document Repository */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <DocumentIcon sx={{ mr: 1, color: "#4caf50" }} />
                  <Typography variant="h6" fontWeight="bold">
                    Key Document Repository
                  </Typography>
                  <Chip
                    label={analysisData.documents.length}
                    size="small"
                    color="success"
                    sx={{ ml: 1 }}
                  />
                </Box>

                <Divider sx={{ mb: 2 }} />

                {analysisData.documents.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
                    No documents found
                  </Typography>
                ) : (
                  <Box>
                    <Tabs value={selectedTab} onChange={(e, v) => setSelectedTab(v)}>
                      <Tab label="All Documents" />
                      {Object.keys(documentsByCourse).map((course) => (
                        <Tab key={course} label={course} />
                      ))}
                    </Tabs>

                    <Box sx={{ mt: 2 }}>
                      {selectedTab === 0 ? (
                        <Grid container spacing={2}>
                          {analysisData.documents.map((doc) => (
                            <Grid item xs={12} sm={6} md={4} key={doc.id}>
                              <Card variant="outlined">
                                <CardContent>
                                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                                    <DocumentIcon sx={{ mr: 1 }} />
                                    <Typography variant="subtitle2" noWrap>
                                      {doc.filename}
                                    </Typography>
                                  </Box>
                                  <Chip label={doc.course} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                                  <Chip label={doc.type.toUpperCase()} size="small" color="primary" sx={{ mr: 0.5, mb: 0.5 }} />
                                  <Chip label={doc.category} size="small" color="secondary" sx={{ mb: 0.5 }} />
                                  {doc.url && (
                                    <Button
                                      size="small"
                                      startIcon={<DownloadIcon />}
                                      fullWidth
                                      sx={{ mt: 1 }}
                                      href={doc.url}
                                      target="_blank"
                                    >
                                      Download
                                    </Button>
                                  )}
                                </CardContent>
                              </Card>
                            </Grid>
                          ))}
                        </Grid>
                      ) : (
                        <Grid container spacing={2}>
                          {documentsByCourse[Object.keys(documentsByCourse)[selectedTab - 1]]?.map((doc) => (
                            <Grid item xs={12} sm={6} md={4} key={doc.id}>
                              <Card variant="outlined">
                                <CardContent>
                                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                                    <DocumentIcon sx={{ mr: 1 }} />
                                    <Typography variant="subtitle2" noWrap>
                                      {doc.filename}
                                    </Typography>
                                  </Box>
                                  <Chip label={doc.type.toUpperCase()} size="small" color="primary" sx={{ mr: 0.5, mb: 0.5 }} />
                                  <Chip label={doc.category} size="small" color="secondary" sx={{ mb: 0.5 }} />
                                  {doc.url && (
                                    <Button
                                      size="small"
                                      startIcon={<DownloadIcon />}
                                      fullWidth
                                      sx={{ mt: 1 }}
                                      href={doc.url}
                                      target="_blank"
                                    >
                                      Download
                                    </Button>
                                  )}
                                </CardContent>
                              </Card>
                            </Grid>
                          ))}
                        </Grid>
                      )}
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
