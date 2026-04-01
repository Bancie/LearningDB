import type { Route } from "./+types/home";
import { Alert, Box, Chip, Stack, Typography } from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import { useOutletContext } from "react-router";
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
    bootstrapped,
    isSending,
    error,
    uiMode,
    input,
    setInput,
    messages,
    sendMessage,
  } = useOutletContext<WorkspaceOutletContext>();

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
            spacing={2}
            sx={{
              minHeight: 0,
              height: "100%",
              justifyContent: "center",
              alignItems: "center",
              px: { xs: 1, sm: 2.5 },
            }}
          >
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
            <Typography variant="body1" color="text.secondary" sx={{ textAlign: "center", maxWidth: 640 }}>
              Trao doi tu nhien, AI se giup truy van va tom tat du lieu hoc tap.
            </Typography>
            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", justifyContent: "center" }}>
              {["Write", "Plan", "Research", "Learn"].map((item) => (
                <Chip key={item} label={item} variant="outlined" sx={{ bgcolor: "background.paper" }} />
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
        </motion.div>
      ) : (
        <motion.div
          key="chat"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.26, ease: "easeOut" }}
          style={{ height: "100%" }}
        >
          <Stack spacing={1.25} sx={{ minHeight: 0, height: "100%" }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Ask LearningDB AI
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Trao doi tu nhien, AI se giup truy van va tom tat du lieu hoc tap.
            </Typography>

            {error && <Alert severity="error">{error}</Alert>}

            <ChatMessageList messages={messages} isSending={isSending} />

            <ChatComposer
              value={input}
              onChange={setInput}
              onSend={sendMessage}
              disabled={!bootstrapped || isSending}
              mode="chat"
              motionLayoutId="home-chat-composer"
              placeholder="Nhap yeu cau, vi du: hien thi activity list cua user nay"
            />
          </Stack>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
