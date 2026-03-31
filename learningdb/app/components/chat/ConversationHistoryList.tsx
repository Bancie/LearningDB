import AddCommentRoundedIcon from "@mui/icons-material/AddCommentRounded";
import ChatRoundedIcon from "@mui/icons-material/ChatRounded";
import { Box, Button, List, ListItemButton, ListItemText, Typography } from "@mui/material";
import type { ConversationSummary } from "./types";

type ConversationHistoryListProps = {
  conversations: ConversationSummary[];
  activeConversationId: string | null;
  onCreateConversation: () => Promise<void>;
  onSelectConversation: (conversationId: string) => Promise<void>;
  collapsed?: boolean;
};

export default function ConversationHistoryList({
  conversations,
  activeConversationId,
  onCreateConversation,
  onSelectConversation,
  collapsed = false,
}: ConversationHistoryListProps) {
  if (collapsed) {
    return (
      <Box sx={{ display: "grid", gap: 1.2, justifyItems: "center", py: 0.6 }}>
        <Button variant="contained" onClick={() => void onCreateConversation()} sx={{ minWidth: 48, px: 0 }}>
          <AddCommentRoundedIcon />
        </Button>
        {conversations.slice(0, 10).map((item) => (
          <ListItemButton
            key={item.id}
            selected={activeConversationId === item.id}
            onClick={() => void onSelectConversation(item.id)}
            sx={{
              borderRadius: 2,
              minHeight: 44,
              width: 48,
              justifyContent: "center",
            }}
            aria-label={item.title}
          >
            <ChatRoundedIcon fontSize="small" />
          </ListItemButton>
        ))}
      </Box>
    );
  }

  return (
    <Box sx={{ py: 0.6 }}>
      <Button
        fullWidth
        variant="contained"
        onClick={() => void onCreateConversation()}
        startIcon={<AddCommentRoundedIcon />}
      >
        New chat
      </Button>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: "block", mt: 1.3, mb: 0.8, px: 0.2 }}
      >
        Conversation History
      </Typography>
      <List sx={{ p: 0 }}>
        {conversations.map((item) => (
          <ListItemButton
            key={item.id}
            selected={activeConversationId === item.id}
            onClick={() => void onSelectConversation(item.id)}
            sx={{
              borderRadius: 2,
              py: 0.7,
              mb: 0.4,
              alignItems: "flex-start",
            }}
          >
            <ListItemText
              primary={item.title}
              secondary={new Date(item.updated_at).toLocaleString()}
              primaryTypographyProps={{
                sx: {
                  fontSize: "0.88rem",
                  fontWeight: 600,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                },
              }}
              secondaryTypographyProps={{
                sx: { fontSize: "0.72rem" },
              }}
            />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
}
