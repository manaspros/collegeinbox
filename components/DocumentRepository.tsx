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
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
} from "@mui/material";
import { formatDistanceToNow } from "date-fns";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DescriptionIcon from "@mui/icons-material/Description";
import ImageIcon from "@mui/icons-material/Image";
import FolderIcon from "@mui/icons-material/Folder";
import DownloadIcon from "@mui/icons-material/Download";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

interface Document {
  id: string;
  name: string;
  course: string;
  mime: string;
  driveFileId?: string;
  emailId?: string;
  attachmentId?: string;
  subject?: string;
  from?: string;
  size?: number;
  createdAt: any;
  embeddingId?: string;
}

export default function DocumentRepository({ userId }: { userId: string }) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [courses, setCourses] = useState<string[]>([]);

  useEffect(() => {
    if (userId) {
      fetchDocuments();
    }
  }, [userId]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const { collection, query, orderBy, getDocs } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase");

      const q = query(
        collection(db, "cache_documents", userId, "files"),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(q);
      const documentsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Document[];

      setDocuments(documentsList);

      // Extract unique courses
      const uniqueCourses = [...new Set(documentsList.map((doc) => doc.course))];
      setCourses(uniqueCourses.filter(Boolean));
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching documents:", err);
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (mime: string) => {
    if (mime.includes("pdf")) return <PictureAsPdfIcon color="error" />;
    if (mime.includes("image")) return <ImageIcon color="primary" />;
    if (mime.includes("document") || mime.includes("word")) return <DescriptionIcon color="info" />;
    return <FolderIcon />;
  };

  const handleDownload = async (doc: Document) => {
    if (doc.emailId && doc.attachmentId) {
      // Gmail attachment - need to fetch via API
      try {
        const response = await fetch("/api/gmail/download-attachment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            messageId: doc.emailId,
            attachmentId: doc.attachmentId,
            filename: doc.name,
          }),
        });

        if (!response.ok) throw new Error("Failed to download attachment");

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = doc.name;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (err: any) {
        console.error("Download error:", err);
        alert("Failed to download file");
      }
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.course.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCourse = courseFilter === "all" || doc.course === courseFilter;
    return matchesSearch && matchesCourse;
  });

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
          Document Repository
        </Typography>
        <Button size="small" onClick={fetchDocuments}>
          Refresh
        </Button>
      </Box>

      {/* Filters */}
      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <TextField
          placeholder="Search documents..."
          size="small"
          fullWidth
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Course</InputLabel>
          <Select
            value={courseFilter}
            label="Course"
            onChange={(e) => setCourseFilter(e.target.value)}
          >
            <MenuItem value="all">All Courses</MenuItem>
            {courses.map((course) => (
              <MenuItem key={course} value={course}>
                {course}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {filteredDocuments.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              {documents.length === 0
                ? "No documents found. Connect your Google Drive and Gmail to see attachments."
                : "No documents match your filters."}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {filteredDocuments.map((doc) => (
            <Card key={doc.id}>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Box sx={{ flexShrink: 0 }}>
                    {getFileIcon(doc.mime)}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle1" fontWeight="bold" noWrap>
                      {doc.name}
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, mt: 0.5, flexWrap: "wrap" }}>
                      <Chip label={doc.course} size="small" color="primary" variant="outlined" />
                      {doc.createdAt && (
                        <Chip
                          label={`Added ${formatDistanceToNow(doc.createdAt.toDate ? doc.createdAt.toDate() : new Date(doc.createdAt), { addSuffix: true })}`}
                          size="small"
                        />
                      )}
                      {doc.driveFileId && <Chip label="Drive" size="small" />}
                      {doc.emailId && <Chip label="Email" size="small" />}
                      {doc.subject && (
                        <Chip
                          label={doc.subject.substring(0, 30) + (doc.subject.length > 30 ? "..." : "")}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </Box>
                  <Box sx={{ display: "flex", gap: 1, flexShrink: 0 }}>
                    <Tooltip title="Download">
                      <IconButton
                        size="small"
                        onClick={() => handleDownload(doc)}
                        color="primary"
                      >
                        <DownloadIcon />
                      </IconButton>
                    </Tooltip>
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
