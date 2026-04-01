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
  /** Called after user actions so mobile drawer can close (e.g. from Layout). */
  onCloseMobileDrawer?: () => void;
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
  onCloseMobileDrawer,
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
    onCloseMobileDrawer?.();
  };

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
            onClick={() => {
              onCloseMobileDrawer?.();
              void onCreateConversation();
            }}
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
          sx={(theme) => ({
            position: "sticky",
            top: 0,
            zIndex: 2,
            // Match Layout drawer paper gradient so the header is not a flat white patch
            background:
              theme.palette.mode === "dark"
                ? "linear-gradient(180deg, #151d28 0%, #0f1419 100%)"
                : "linear-gradient(180deg, #f8fbff 0%, #eef4ff 100%)",
            pb: 1,
            mb: 0.5,
          })}
        >
          <Button
            fullWidth
            variant="contained"
            onClick={() => {
              onCloseMobileDrawer?.();
              void onCreateConversation();
            }}
            disabled={disableCreate}
            startIcon={<AddCommentRoundedIcon />}
          >
            {creating ? "Creating..." : "New chat"}
          </Button>
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
                onClick={() => {
                  onCloseMobileDrawer?.();
                  void onSelectConversation(item.id);
                }}
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
