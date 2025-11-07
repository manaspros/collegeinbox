"use client";

// @ts-ignore - AI SDK import
import { useChat } from "@ai-sdk/react";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { useState, useRef, useEffect } from "react";
import {
  Paper,
  TextField,
  Button,
  Box,
  Typography,
  CircularProgress,
  IconButton,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import MicIcon from "@mui/icons-material/Mic";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import PersonIcon from "@mui/icons-material/Person";

export default function ChatInterface() {
  const { user, loading } = useFirebaseAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading, error } =
    useChat({
      api: "/api/chat",
      body: {
        userId: user?.uid,
      },
      onError: (error) => {
        console.error("Chat error:", error);
      },
    });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (loading) {
    return (
      <Paper
        elevation={2}
        sx={{ p: 4, textAlign: "center", backgroundColor: "#f5f5f5" }}
      >
        <CircularProgress size={32} />
        <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
          Loading...
        </Typography>
      </Paper>
    );
  }

  if (!user) {
    return (
      <Paper
        elevation={2}
        sx={{ p: 4, textAlign: "center", backgroundColor: "#f5f5f5" }}
      >
        <Typography variant="h6" color="text.secondary">
          Please sign in to use the AI assistant
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={3} sx={{ height: "600px", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: "1px solid #e0e0e0",
          backgroundColor: "#1976d2",
          color: "white",
        }}
      >
        <Typography variant="h6" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <SmartToyIcon /> AI Academic Assistant
        </Typography>
        <Typography variant="caption">
          Ask me about deadlines, assignments, emails, and more!
        </Typography>
      </Box>

      {/* Messages Area */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          p: 2,
          backgroundColor: "#fafafa",
        }}
      >
        {messages.length === 0 && (
          <Box sx={{ textAlign: "center", mt: 4, color: "text.secondary" }}>
            <SmartToyIcon sx={{ fontSize: 60, mb: 2, opacity: 0.5 }} />
            <Typography variant="body1">
              Hi! I&apos;m your AI academic assistant. Try asking:
            </Typography>
            <Box sx={{ mt: 2, textAlign: "left", maxWidth: 400, mx: "auto" }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                • &ldquo;Show me all deadlines this week&rdquo;
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                • &ldquo;Find PDFs from my Machine Learning course&rdquo;
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                • &ldquo;What assignments are due this weekend?&rdquo;
              </Typography>
              <Typography variant="body2">
                • &ldquo;Search for unread emails from professors&rdquo;
              </Typography>
            </Box>
          </Box>
        )}

        {messages.map((msg) => (
          <Box
            key={msg.id}
            sx={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              mb: 2,
            }}
          >
            <Box
              sx={{
                maxWidth: "70%",
                display: "flex",
                gap: 1,
                flexDirection: msg.role === "user" ? "row-reverse" : "row",
              }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  backgroundColor: msg.role === "user" ? "#1976d2" : "#4caf50",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  flexShrink: 0,
                }}
              >
                {msg.role === "user" ? (
                  <PersonIcon fontSize="small" />
                ) : (
                  <SmartToyIcon fontSize="small" />
                )}
              </Box>
              <Paper
                elevation={1}
                sx={{
                  p: 2,
                  backgroundColor: msg.role === "user" ? "#e3f2fd" : "#ffffff",
                  borderRadius: 2,
                }}
              >
                <Typography
                  variant="body1"
                  sx={{
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {msg.content}
                </Typography>
              </Paper>
            </Box>
          </Box>
        ))}

        {isLoading && (
          <Box sx={{ display: "flex", gap: 1, alignItems: "center", mb: 2 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                backgroundColor: "#4caf50",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
              }}
            >
              <SmartToyIcon fontSize="small" />
            </Box>
            <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CircularProgress size={16} />
                <Typography variant="body2" color="text.secondary">
                  Thinking...
                </Typography>
              </Box>
            </Paper>
          </Box>
        )}

        {error && (
          <Box sx={{ mb: 2 }}>
            <Paper
              elevation={1}
              sx={{
                p: 2,
                backgroundColor: "#ffebee",
                borderRadius: 2,
                border: "1px solid #ef5350",
              }}
            >
              <Typography variant="body2" color="error">
                Error: {error.message}
              </Typography>
            </Paper>
          </Box>
        )}

        <div ref={messagesEndRef} />
      </Box>

      {/* Input Area */}
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          p: 2,
          borderTop: "1px solid #e0e0e0",
          backgroundColor: "white",
        }}
      >
        <Box sx={{ display: "flex", gap: 1 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Ask me anything... (e.g., 'Show me deadlines this week')"
            value={input ?? ""}
            onChange={handleInputChange}
            disabled={isLoading || !user}
            size="small"
            autoComplete="off"
            sx={{ backgroundColor: "white" }}
          />
          <IconButton
            color="primary"
            disabled
            sx={{ opacity: 0.5 }}
            title="Voice input (coming soon)"
          >
            <MicIcon />
          </IconButton>
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading || !(input || "").trim()}
            endIcon={<SendIcon />}
          >
            Send
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}
