import { Box, CircularProgress, Paper, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useEffect, useRef } from "react";
import ChatMarkdown from "./ChatMarkdown";
import type { UiMessage } from "./types";

type ChatMessageListProps = {
  messages: UiMessage[];
  isSending: boolean;
};

export default function ChatMessageList({ messages, isSending }: ChatMessageListProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) {
      return;
    }
    node.scrollTop = node.scrollHeight;
  }, [messages, isSending]);

  return (
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
  );
}
