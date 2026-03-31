import { Box, CircularProgress, Paper, Stack, Typography } from "@mui/material";
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
      variant="outlined"
      sx={{
        p: 1.5,
        flex: 1,
        overflowY: "auto",
        bgcolor: "#f8faff",
        minHeight: 280,
      }}
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
                borderRadius: 2,
                px: 1.3,
                py: 1,
                bgcolor: isUser ? "primary.main" : "background.paper",
                color: isUser ? "primary.contrastText" : "text.primary",
                border: isUser ? "none" : "1px solid rgba(15, 23, 42, 0.08)",
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
