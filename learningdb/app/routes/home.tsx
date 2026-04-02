import type { Route } from "./+types/home";
import AddCommentRoundedIcon from "@mui/icons-material/AddCommentRounded";
import { Alert, Box, Button, Chip, Stack, Typography } from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import { useOutletContext } from "react-router";
import ChatHeader from "~/components/chat/ChatHeader";
import ChatComposer from "~/components/chat/ChatComposer";
import ChatMessageList from "~/components/chat/ChatMessageList";
import type { WorkspaceOutletContext } from "~/workspace-context";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "LearningDB - AI Workspace" },
    { name: "description", content: "AI-first LearningDB assistant workspace" },
  ];
}

export default function Home() {
  const {
    userId,
    setUserId,
    providers,
    provider,
    model,
    models,
    bootstrapped,
    isBootstrapping,
    isSavingPreference,
    bootstrap,
    handleProviderChange,
    handleModelChange,
    isSending,
    error,
    uiMode,
    input,
    setInput,
    messages,
    sendMessage,
    createNewConversation,
    isCreatingConversation,
  } = useOutletContext<WorkspaceOutletContext>();

  const chatHeaderProps = {
    userId,
    onUserIdChange: setUserId,
    provider,
    model,
    providers,
    models,
    bootstrapped,
    isBootstrapping,
    isSavingPreference,
    onBootstrap: bootstrap,
    onProviderChange: handleProviderChange,
    onModelChange: handleModelChange,
  } as const;

  return (
    <AnimatePresence mode="wait" initial={false}>
      {uiMode === "intro" ? (
        <motion.div
          key="intro"
          initial={{ opacity: 0, y: 14, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.99 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          style={{ height: "100%" }}
        >
          <Stack
            spacing={0}
            sx={{
              minHeight: 0,
              height: "100%",
              px: { xs: 1, sm: 2.5 },
            }}
          >
            <Stack
              direction="row"
              justifyContent="flex-end"
              sx={{ flexShrink: 0, width: "100%", alignSelf: "stretch" }}
            >
              <ChatHeader {...chatHeaderProps} />
            </Stack>
            <Stack
              spacing={2}
              sx={{
                flex: 1,
                minHeight: 0,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Box
                component="img"
                src="/learningdblogo.png"
                alt="LearningDB"
                sx={{
                  height: { xs: 56, sm: 64 },
                  width: "auto",
                  objectFit: "contain",
                  display: "block",
                }}
              />
              <Typography
                variant="h3"
                sx={{
                  textAlign: "center",
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  fontSize: { xs: "2rem", sm: "2.6rem" },
                }}
              >
                Ask LearningDB AI
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ textAlign: "center", maxWidth: 640 }}
              >
                Trao doi tu nhien, AI se giup truy van va tom tat du lieu hoc tap.
              </Typography>
              <Stack
                direction="row"
                spacing={1}
                sx={{ flexWrap: "wrap", justifyContent: "center" }}
              >
                {["Write", "Plan", "Research", "Learn"].map((item) => (
                  <Chip
                    key={item}
                    label={item}
                    variant="outlined"
                    sx={{ bgcolor: "background.paper" }}
                  />
                ))}
              </Stack>

              <Box sx={{ width: "100%", maxWidth: 720, pt: 1 }}>
                <ChatComposer
                  value={input}
                  onChange={setInput}
                  onSend={sendMessage}
                  disabled={!bootstrapped || isSending}
                  mode="intro"
                  motionLayoutId="home-chat-composer"
                  placeholder="Nhap yeu cau, vi du: hien thi activity list cua user nay"
                />
              </Box>

              {error && (
                <Box sx={{ width: "100%", maxWidth: 720 }}>
                  <Alert severity="error">{error}</Alert>
                </Box>
              )}
            </Stack>
          </Stack>
        </motion.div>
      ) : (
        <motion.div
          key="chat"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.26, ease: "easeOut" }}
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          <Box
            sx={{
              flexShrink: 0,
              alignSelf: "stretch",
              width: "100%",
              mb: { xs: 1, sm: 1.25 },
              px: { xs: 1.5, sm: 2, md: 2.5 },
              display: "flex",
              flexDirection: { xs: "row", sm: "column" },
              alignItems: { xs: "flex-start", sm: "flex-start" },
              justifyContent: { xs: "space-between", sm: "flex-start" },
              gap: { xs: 1, sm: 0 },
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0, maxWidth: { sm: "min(560px, 72%)" } }}>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                Ask LearningDB AI
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Trao doi tu nhien, AI se giup truy van va tom tat du lieu hoc tap.
              </Typography>
            </Box>
            <Button
              variant="outlined"
              size="small"
              onClick={() => void createNewConversation()}
              disabled={isCreatingConversation || isSending}
              aria-label={
                isCreatingConversation ? "Creating conversation" : "New chat"
              }
              sx={{
                display: { xs: "inline-flex", sm: "none" },
                flexShrink: 0,
                minWidth: 40,
                px: 1,
              }}
            >
              <AddCommentRoundedIcon aria-hidden />
            </Button>
          </Box>

          <Stack
            spacing={1.25}
            sx={{
              flex: 1,
              minHeight: 0,
              minWidth: 0,
              width: "100%",
              maxWidth: "100%",
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              bgcolor: "background.paper",
              borderRadius: "15px",
              px: { xs: 1.5, sm: 2, md: 2.5 },
              py: { xs: 1, sm: 1.25 },
            }}
          >
            <Stack
              direction="row"
              justifyContent="flex-end"
              sx={{ flexShrink: 0, width: "100%" }}
            >
              <ChatHeader {...chatHeaderProps} />
            </Stack>

            {error && <Alert severity="error">{error}</Alert>}

            <ChatMessageList messages={messages} isSending={isSending} />

            <Box sx={{ flexShrink: 0, width: "100%", pt: 0.25 }}>
              <ChatComposer
                value={input}
                onChange={setInput}
                onSend={sendMessage}
                disabled={!bootstrapped || isSending}
                mode="chat"
                motionLayoutId="home-chat-composer"
                placeholder="Nhap yeu cau, vi du: hien thi activity list cua user nay"
              />
            </Box>
          </Stack>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
