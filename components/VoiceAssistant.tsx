"use client";

import { useState, useEffect, useRef } from "react";
import {
  Box,
  IconButton,
  Typography,
  Chip,
  Paper,
  Fade,
} from "@mui/material";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";

interface VoiceAssistantProps {
  onCommand: (command: string) => void;
  userId: string;
}

export default function VoiceAssistant({ onCommand, userId }: VoiceAssistantProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check if Web Speech API is supported
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setIsSupported(false);
        console.warn("Speech Recognition API not supported in this browser");
        return;
      }

      // Initialize speech recognition
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
        setTranscript("");
      };

      recognition.onresult = (event: any) => {
        const current = event.resultIndex;
        const transcriptText = event.results[current][0].transcript;
        setTranscript(transcriptText);

        // If result is final, process the command
        if (event.results[current].isFinal) {
          processCommand(transcriptText);
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error("Error starting recognition:", error);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const processCommand = async (command: string) => {
    const lowerCommand = command.toLowerCase();

    // Process common voice commands
    if (
      lowerCommand.includes("deadline") ||
      lowerCommand.includes("due") ||
      lowerCommand.includes("assignment")
    ) {
      onCommand(command);
      speak("Fetching your deadlines");
    } else if (lowerCommand.includes("email") || lowerCommand.includes("mail")) {
      onCommand(command);
      speak("Checking your emails");
    } else if (lowerCommand.includes("schedule") || lowerCommand.includes("calendar")) {
      onCommand(command);
      speak("Looking at your schedule");
    } else if (lowerCommand.includes("document") || lowerCommand.includes("file")) {
      onCommand(command);
      speak("Searching your documents");
    } else {
      onCommand(command);
      speak("Let me check that for you");
    }
  };

  const speak = (text: string) => {
    if ("speechSynthesis" in window) {
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  if (!isSupported) {
    return (
      <Box sx={{ textAlign: "center", p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Voice commands are not supported in this browser. Please use Chrome, Edge, or Safari.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <IconButton
          color={isListening ? "error" : "primary"}
          size="large"
          onClick={isListening ? stopListening : startListening}
          sx={{
            width: 64,
            height: 64,
            backgroundColor: isListening ? "error.light" : "primary.light",
            "&:hover": {
              backgroundColor: isListening ? "error.main" : "primary.main",
            },
          }}
        >
          {isListening ? <MicOffIcon fontSize="large" /> : <MicIcon fontSize="large" />}
        </IconButton>

        {isSpeaking && (
          <Chip
            icon={<VolumeUpIcon />}
            label="Speaking..."
            color="secondary"
            variant="outlined"
          />
        )}
      </Box>

      <Fade in={isListening || transcript !== ""}>
        <Paper
          elevation={3}
          sx={{
            p: 2,
            minWidth: 300,
            maxWidth: 500,
            textAlign: "center",
            backgroundColor: isListening ? "primary.light" : "background.paper",
          }}
        >
          {isListening ? (
            <Box>
              <Typography variant="body2" color="primary" gutterBottom>
                Listening...
              </Typography>
              <Typography variant="body1">
                {transcript || "Say a command..."}
              </Typography>
            </Box>
          ) : transcript ? (
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                You said:
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                {transcript}
              </Typography>
            </Box>
          ) : null}
        </Paper>
      </Fade>

      <Box sx={{ textAlign: "center" }}>
        <Typography variant="caption" color="text.secondary">
          Try saying:
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1, justifyContent: "center" }}>
          <Chip label="What's due today?" size="small" variant="outlined" />
          <Chip label="Show my deadlines" size="small" variant="outlined" />
          <Chip label="Check my emails" size="small" variant="outlined" />
          <Chip label="Find documents" size="small" variant="outlined" />
        </Box>
      </Box>
    </Box>
  );
}
