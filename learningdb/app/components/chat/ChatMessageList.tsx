import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import {
  Alert,
  Box,
  CircularProgress,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useEffect, useRef, useState } from "react";
import ChatMarkdown from "./ChatMarkdown";
import type { UiMessage } from "./types";

type ChatMessageListProps = {
  messages: UiMessage[];
  isSending: boolean;
};

type SnackbarState = {
  open: boolean;
  message: string;
  severity: "success" | "error";
};

export default function ChatMessageList({ messages, isSending }: ChatMessageListProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) {
      return;
    }
    node.scrollTop = node.scrollHeight;
  }, [messages, isSending]);

  const copyAssistantReply = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setSnackbar({ open: true, message: "Da sao chep cau tra loi", severity: "success" });
    } catch {
      setSnackbar({
        open: true,
        message: "Khong the sao chep. Kiem tra quyen trinh duyet hoac HTTPS.",
        severity: "error",
      });
    }
  };

  return (
    <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
      <Paper
        ref={scrollRef}
        elevation={0}
        sx={(theme) => ({
          p: 1.5,
          flex: 1,
          overflowY: "auto",
          border: "none",
          bgcolor:
            theme.palette.mode === "dark"
              ? alpha(theme.palette.primary.main, 0.12)
              : alpha(theme.palette.primary.main, 0.04),
          minHeight: 280,
        })}
      >
        <Stack spacing={1.2}>
          {messages.map((message) => {
            const isUser = message.role === "user";
            return (
              <Box
                key={message.id}
                sx={{
                  alignSelf: isUser ? "flex-end" : "flex-start",
                  maxWidth: { xs: "96%", sm: "86%" },
                  borderRadius: "15px",
                  px: 1.3,
                  py: 1,
                  bgcolor: isUser ? "primary.main" : "background.paper",
                  color: isUser ? "primary.contrastText" : "text.primary",
                  border: "none",
                }}
              >
                <ChatMarkdown content={message.content} isUser={isUser} />
                {!isUser && (
                  <Stack direction="row" justifyContent="flex-end" sx={{ mt: 0.5 }}>
                    <IconButton
                      size="small"
                      aria-label="Sao chep cau tra loi AI"
                      onClick={() => void copyAssistantReply(message.content)}
                      sx={{
                        color: "text.secondary",
                        "&:hover": { color: "text.primary", bgcolor: "action.hover" },
                      }}
                    >
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                )}
              </Box>
            );
          })}
          {isSending && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CircularProgress size={16} />
              <Typography variant="body2" color="text.secondary">
                AI dang suy nghi...
              </Typography>
            </Box>
          )}
        </Stack>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
