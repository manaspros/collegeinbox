"use client";

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
  Slider,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import DeleteIcon from "@mui/icons-material/Delete";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import PersonIcon from "@mui/icons-material/Person";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function ChatInterface() {
  const { user, loading } = useFirebaseAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyLength, setHistoryLength] = useState(10); // Configurable history
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || isLoading || !user) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    // Add user message to chat
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      // Only send last N messages for context (configurable)
      const contextMessages = [...messages, userMessage].slice(-historyLength);

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: contextMessages,
          userId: user.uid,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response body");
      }

      let assistantContent = "";
      const assistantMessageId = (Date.now() + 1).toString();

      // Add empty assistant message that will be updated
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMessageId,
          role: "assistant",
          content: "",
        },
      ]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("0:")) {
            try {
              const jsonStr = line.slice(2).trim();
              if (jsonStr) {
                const data = JSON.parse(jsonStr);
                if (typeof data === "string") {
                  assistantContent += data;

                  // Update the assistant message in real-time
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessageId
                        ? { ...msg, content: assistantContent }
                        : msg
                    )
                  );
                }
              }
            } catch (e) {
              // Ignore JSON parse errors for partial chunks
              console.debug("Parse error:", e);
            }
          }
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      console.error("Chat error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
  };

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
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <SmartToyIcon /> AI Academic Assistant
          </Typography>
          <Typography variant="caption">
            Ask about assignments, deadlines, emails, and documents
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <Box sx={{ minWidth: 150 }}>
            <Typography variant="caption">History: {historyLength} messages</Typography>
            <Slider
              value={historyLength}
              onChange={(_, value) => setHistoryLength(value as number)}
              min={5}
              max={50}
              step={5}
              size="small"
              sx={{ color: "white" }}
            />
          </Box>
          <IconButton color="inherit" onClick={clearChat} title="Clear chat">
            <DeleteIcon />
          </IconButton>
        </Box>
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
                • &ldquo;Show me emails from the last 7 days&rdquo;
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                • &ldquo;What are my upcoming calendar events?&rdquo;
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                • &ldquo;Find PDF files about machine learning&rdquo;
              </Typography>
              <Typography variant="body2">
                • &ldquo;List my assignments and deadlines&rdquo;
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
                  {msg.content || (
                    <CircularProgress size={16} />
                  )}
                </Typography>
              </Paper>
            </Box>
          </Box>
        ))}

        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
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
                Error: {error}
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
            placeholder="Ask me anything... (e.g., 'Show me emails from last week')"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading || !user}
            size="small"
            autoComplete="off"
            sx={{ backgroundColor: "white" }}
            multiline
            maxRows={4}
          />
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading || !input.trim()}
            endIcon={<SendIcon />}
            sx={{ minWidth: "100px" }}
          >
            Send
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}
