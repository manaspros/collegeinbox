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
  url: string;
  createdAt: string;
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
      const response = await fetch(`/api/documents?userId=${userId}`);
      if (!response.ok) throw new Error("Failed to fetch documents");
      const data = await response.json();
      setDocuments(data.documents || []);

      // Extract unique courses
      const uniqueCourses = [...new Set(data.documents.map((doc: Document) => doc.course))];
      setCourses(uniqueCourses.filter(Boolean));
    } catch (err: any) {
      setError(err.message);
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
                      <Chip
                        label={`Added ${formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}`}
                        size="small"
                      />
                      {doc.driveFileId && <Chip label="Drive" size="small" />}
                      {doc.emailId && <Chip label="Email" size="small" />}
                    </Box>
                  </Box>
                  <Box sx={{ display: "flex", gap: 1, flexShrink: 0 }}>
                    <Tooltip title="Open in new tab">
                      <IconButton
                        size="small"
                        href={doc.url}
                        target="_blank"
                        color="primary"
                      >
                        <OpenInNewIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Download">
                      <IconButton
                        size="small"
                        href={doc.url}
                        download
                        color="secondary"
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
