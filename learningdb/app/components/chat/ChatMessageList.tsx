import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useEffect, useRef, useState } from "react";
import type { ChatToolInvocation } from "~/services/orchestrator";
import ChatMarkdown from "./ChatMarkdown";
import type { UiMessage } from "./types";

function utcApiLabel(output: Record<string, unknown>): string {
  const sql = output.utc_sql_datetime;
  const iso = output.utc_iso8601;
  if (typeof sql === "string" && sql.trim()) {
    return `UTC (API): ${sql}`;
  }
  if (typeof iso === "string" && iso.trim()) {
    return `UTC (API): ${iso}`;
  }
  return "";
}

function formatInUserTimeZone(isoUtc: string, timeZone: string): string | null {
  try {
    const d = new Date(isoUtc);
    if (Number.isNaN(d.getTime())) {
      return null;
    }
    return new Intl.DateTimeFormat(undefined, {
      timeZone: timeZone.trim(),
      dateStyle: "medium",
      timeStyle: "medium",
    }).format(d);
  } catch {
    return null;
  }
}

type ChatMessageListProps = {
  messages: UiMessage[];
  isSending: boolean;
  userTimeZone?: string | null;
};

type SnackbarState = {
  open: boolean;
  message: string;
  severity: "success" | "error";
};

export default function ChatMessageList({
  messages,
  isSending,
  userTimeZone = null,
}: ChatMessageListProps) {
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
      setSnackbar({
        open: true,
        message: "Da sao chep cau tra loi",
        severity: "success",
      });
    } catch {
      setSnackbar({
        open: true,
        message: "Khong the sao chep. Kiem tra quyen trinh duyet hoac HTTPS.",
        severity: "error",
      });
    }
  };

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignSelf: "stretch",
      }}
    >
      <Paper
        ref={scrollRef}
        elevation={0}
        sx={(theme) => ({
          width: "100%",
          minWidth: 0,
          minHeight: 0,
          flex: 1,
          p: { xs: 1.25, sm: 1.75 },
          overflowY: "auto",
          overflowX: "hidden",
          border: "none",
          borderRadius: "15px",
          bgcolor:
            theme.palette.mode === "dark"
              ? alpha(theme.palette.primary.main, 0.12)
              : alpha(theme.palette.primary.main, 0.04),
          boxSizing: "border-box",
        })}
      >
        <Stack spacing={1.25}>
          {messages.map((message) => {
            const isUser = message.role === "user";
            return (
              <Box
                key={message.id}
                sx={{
                  alignSelf: isUser ? "flex-end" : "stretch",
                  width: isUser ? "auto" : "100%",
                  minWidth: 0,
                  maxWidth: isUser
                    ? { xs: "92%", sm: "min(560px, 88%)" }
                    : "100%",
                  borderRadius: "15px",
                  px: 1.3,
                  py: 1,
                  bgcolor: isUser ? "primary.main" : "background.paper",
                  color: isUser ? "primary.contrastText" : "text.primary",
                  border: "none",
                }}
              >
                <ChatMarkdown content={message.content} isUser={isUser} />
                {!isUser &&
                  message.toolInvocations &&
                  message.toolInvocations.length > 0 && (
                    <Stack
                      spacing={0.75}
                      sx={{
                        mt: 1,
                        pt: 1,
                        borderTop: 1,
                        borderColor: "divider",
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        Tool calls
                      </Typography>
                      {message.toolInvocations.map((inv: ChatToolInvocation, idx) => {
                        const chipLabel = `${inv.name} · ${inv.status} · ${inv.latency_ms}ms`;
                        const out = inv.output ?? undefined;
                        const iso =
                          out &&
                          typeof out.utc_iso8601 === "string" &&
                          out.utc_iso8601.trim()
                            ? out.utc_iso8601.trim()
                            : null;
                        const localLine =
                          inv.name === "get_server_time" &&
                          iso &&
                          userTimeZone
                            ? formatInUserTimeZone(iso, userTimeZone)
                            : null;
                        return (
                          <Box key={`${inv.name}-${idx}`}>
                            <Chip
                              label={chipLabel}
                              size="small"
                              variant="outlined"
                              sx={{ height: "auto", py: 0.25 }}
                            />
                            {inv.error && (
                              <Typography
                                variant="caption"
                                color="error"
                                sx={{ display: "block", mt: 0.25 }}
                              >
                                {inv.error}
                              </Typography>
                            )}
                            {inv.name === "get_server_time" && out && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: "block", mt: 0.35 }}
                              >
                                {utcApiLabel(out)}
                                {localLine ? (
                                  <>
                                    <br />
                                    Your time ({userTimeZone}): {localLine}
                                  </>
                                ) : userTimeZone ? (
                                  <>
                                    <br />
                                    (Could not format for USER_LOCATION; check
                                    IANA id.)
                                  </>
                                ) : null}
                              </Typography>
                            )}
                          </Box>
                        );
                      })}
                    </Stack>
                  )}
                {!isUser && (
                  <Stack
                    direction="row"
                    justifyContent="flex-end"
                    sx={{ mt: 0.5 }}
                  >
                    <IconButton
                      size="small"
                      aria-label="Sao chep cau tra loi AI"
                      onClick={() => void copyAssistantReply(message.content)}
                      sx={{
                        color: "text.secondary",
                        "&:hover": {
                          color: "text.primary",
                          bgcolor: "action.hover",
                        },
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
