import AddCommentRoundedIcon from "@mui/icons-material/AddCommentRounded";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";
import { useState } from "react";
import type { ConversationSummary } from "./types";

type ConversationHistoryListProps = {
  conversations: ConversationSummary[];
  activeConversationId: string | null;
  onCreateConversation: () => Promise<void>;
  onSelectConversation: (conversationId: string) => Promise<void>;
  onDeleteConversation: (conversationId: string) => Promise<void>;
  disableCreate?: boolean;
  creating?: boolean;
  disableDelete?: boolean;
  deletingConversationId?: string | null;
  collapsed?: boolean;
};

export default function ConversationHistoryList({
  conversations,
  activeConversationId,
  onCreateConversation,
  onSelectConversation,
  onDeleteConversation,
  disableCreate = false,
  creating = false,
  disableDelete = false,
  deletingConversationId = null,
  collapsed = false,
}: ConversationHistoryListProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const openDeleteConfirm = (conversationId: string) => {
    setPendingDeleteId(conversationId);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDeleteId) {
      return;
    }
    await onDeleteConversation(pendingDeleteId);
    setConfirmOpen(false);
    setPendingDeleteId(null);
  };

  const stickyHeaderBg = "rgba(248, 251, 255, 0.96)";

  if (collapsed) {
    return (
      <>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            py: 0.25,
            px: 0,
          }}
        >
          <Button
            variant="contained"
            onClick={() => void onCreateConversation()}
            disabled={disableCreate}
            sx={{
              width: 40,
              height: 40,
              minWidth: 40,
              p: 0,
              borderRadius: 2,
              "& .MuiSvgIcon-root": { fontSize: "1.25rem" },
            }}
            aria-label={creating ? "Creating conversation" : "New chat"}
          >
            <AddCommentRoundedIcon />
          </Button>
        </Box>
        <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} fullWidth maxWidth="xs">
          <DialogTitle>Xoa cuoc tro chuyen?</DialogTitle>
          <DialogContent>Hanh dong nay danh dau xoa mem; ban co the them khoi phuc sau neu can.</DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmOpen(false)}>Huy</Button>
            <Button color="error" variant="contained" onClick={() => void handleConfirmDelete()}>
              Xoa
            </Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <Box sx={{ py: 0.6, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <Box
          sx={{
            position: "sticky",
            top: 0,
            zIndex: 2,
            bgcolor: stickyHeaderBg,
            backdropFilter: "blur(8px)",
            pb: 1,
            mb: 0.5,
            borderBottom: "1px solid rgba(15, 23, 42, 0.06)",
          }}
        >
          <Button
            fullWidth
            variant="contained"
            onClick={() => void onCreateConversation()}
            disabled={disableCreate}
            startIcon={<AddCommentRoundedIcon />}
          >
            {creating ? "Creating..." : "New chat"}
          </Button>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mt: 1.3, mb: 0, px: 0.2 }}
          >
            Conversation History
          </Typography>
        </Box>
        <List sx={{ p: 0, flex: 1, minHeight: 0 }}>
          {conversations.map((item) => (
            <ListItem
              key={item.id}
              disablePadding
              secondaryAction={
                <IconButton
                  edge="end"
                  aria-label="Delete conversation"
                  disabled={disableDelete || deletingConversationId === item.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    openDeleteConfirm(item.id);
                  }}
                  size="small"
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              }
            >
              <ListItemButton
                selected={activeConversationId === item.id}
                onClick={() => void onSelectConversation(item.id)}
                sx={{
                  borderRadius: 2,
                  py: 0.7,
                  pr: 6,
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
            </ListItem>
          ))}
        </List>
      </Box>
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Xoa cuoc tro chuyen?</DialogTitle>
        <DialogContent>Hanh dong nay danh dau xoa mem; ban co the them khoi phuc sau neu can.</DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Huy</Button>
          <Button color="error" variant="contained" onClick={() => void handleConfirmDelete()}>
            Xoa
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
