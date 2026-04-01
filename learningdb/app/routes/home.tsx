import type { Route } from "./+types/home";
import Layout from "~/components/Layout";
import { Alert, Box, Chip, Paper, Stack, Typography, type SelectChangeEvent } from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import {
  createConversation,
  deleteConversation,
  getConversationMessages,
  getChatPreference,
  getProviders,
  listConversations,
  type ConversationSummary,
  putChatPreference,
  sendChatMessage,
  type ChatHistoryMessage,
  type ProviderCatalogItem,
} from "~/services/orchestrator";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import ChatComposer from "~/components/chat/ChatComposer";
import ChatHeader from "~/components/chat/ChatHeader";
import ChatMessageList from "~/components/chat/ChatMessageList";
import ConversationHistoryList from "~/components/chat/ConversationHistoryList";
import ToolsSection from "~/components/chat/ToolsSection";
import { menuItems } from "~/components/Layout";
import type { UiMessage } from "~/components/chat/types";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "LearningDB - AI Workspace" },
    { name: "description", content: "AI-first LearningDB assistant workspace" },
  ];
}

const toMessageId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;

/** Prefer reusing an existing empty thread instead of creating duplicates (backend: LAST_MESSAGE_AT is null). */
function pickNewestEmptyConversation(items: ConversationSummary[]): ConversationSummary | undefined {
  const empties = items.filter((c) => !c.last_message_at);
  if (empties.length === 0) {
    return undefined;
  }
  return empties.reduce((a, b) => (Date.parse(a.updated_at) >= Date.parse(b.updated_at) ? a : b));
}

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();

  const [userId, setUserId] = useState("1");
  const [providers, setProviders] = useState<ProviderCatalogItem[]>([]);
  const [provider, setProvider] = useState("openai");
  const [model, setModel] = useState("gpt-4.1-mini");
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [isSavingPreference, setIsSavingPreference] = useState(false);

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [isDeletingConversation, setIsDeletingConversation] = useState(false);
  const [deletingConversationId, setDeletingConversationId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [uiMode, setUiMode] = useState<"intro" | "chat">("intro");

  const selectedProvider = useMemo(
    () => providers.find((item) => item.id === provider),
    [providers, provider]
  );
  const models = selectedProvider?.models ?? [];

  const parsedUserId = Number(userId);
  const isValidUserId = Number.isFinite(parsedUserId) && parsedUserId > 0;
  const toolsForSidebar = menuItems.filter((item) => item.path !== "/");

  const refreshConversations = async (nextUserId: number) => {
    const conversationRes = await listConversations(nextUserId);
    setConversations(conversationRes.data);
    return conversationRes.data;
  };

  const loadConversation = async (nextUserId: number, conversationId: string) => {
    const messageRes = await getConversationMessages(nextUserId, conversationId);
    setActiveConversationId(conversationId);
    setMessages(
      messageRes.data.map((item) => ({
        id: item.id,
        role: item.role,
        content: item.content,
        createdAt: item.created_at,
      }))
    );
    return messageRes.data.length;
  };

  const bootstrap = async () => {
    if (!isValidUserId) {
      setError("User ID khong hop le.");
      return;
    }
    setError("");
    setIsBootstrapping(true);
    try {
      const [providerRes, preferenceRes, conversationRes] = await Promise.all([
        getProviders(),
        getChatPreference(parsedUserId),
        listConversations(parsedUserId),
      ]);
      const providerData = providerRes.data;
      setProviders(providerData);
      setConversations(conversationRes.data);

      const preferred = preferenceRes.data;
      if (preferred) {
        setProvider(preferred.provider);
        setModel(preferred.model);
      } else {
        const firstProvider = providerData.find((item) => item.available) ?? providerData[0];
        const firstModel = firstProvider?.models.find((item) => item.available) ?? firstProvider?.models[0];
        if (firstProvider?.id) {
          setProvider(firstProvider.id);
        }
        if (firstModel?.id) {
          setModel(firstModel.id);
        }
      }

      if (conversationRes.data.length > 0) {
        const messageCount = await loadConversation(parsedUserId, conversationRes.data[0].id);
        setUiMode(messageCount === 0 ? "intro" : "chat");
      } else {
        setActiveConversationId(null);
        setMessages([]);
        setUiMode("intro");
      }
      setBootstrapped(true);
    } catch (err) {
      console.error(err);
      setError("Khong tai duoc provider/model, history hoac preference.");
    } finally {
      setIsBootstrapping(false);
    }
  };

  const savePreference = async (nextProvider: string, nextModel: string) => {
    const parsedUserId = Number(userId);
    if (!Number.isFinite(parsedUserId) || parsedUserId <= 0) {
      return;
    }
    setIsSavingPreference(true);
    try {
      await putChatPreference(parsedUserId, nextProvider, nextModel);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Khong luu duoc preference provider/model.");
    } finally {
      setIsSavingPreference(false);
    }
  };

  const handleProviderChange = async (event: SelectChangeEvent) => {
    const nextProvider = event.target.value;
    setProvider(nextProvider);
    const nextProviderEntry = providers.find((item) => item.id === nextProvider);
    const fallbackModel =
      nextProviderEntry?.models.find((item) => item.available)?.id ??
      nextProviderEntry?.models[0]?.id ??
      "";
    setModel(fallbackModel);
    if (fallbackModel) {
      await savePreference(nextProvider, fallbackModel);
    }
  };

  const handleModelChange = async (event: SelectChangeEvent) => {
    const nextModel = event.target.value;
    setModel(nextModel);
    await savePreference(provider, nextModel);
  };

  const createNewConversation = async () => {
    if (!isValidUserId) {
      setError("User ID khong hop le.");
      return;
    }
    if (isSending || isCreatingConversation || isDeletingConversation) {
      return;
    }

    const shouldReuseCurrentConversation =
      messages.length === 0 &&
      !isSending &&
      // Keep the current draft context (active thread or intro draft with unsent input).
      (Boolean(activeConversationId) || uiMode === "intro" || input.trim().length > 0);
    if (shouldReuseCurrentConversation) {
      return;
    }

    let listForReuse = conversations;
    try {
      listForReuse = await refreshConversations(parsedUserId);
    } catch {
      // keep stale conversations; pick below may still work
    }
    const reuseEmptyElsewhere = pickNewestEmptyConversation(listForReuse);
    if (reuseEmptyElsewhere && reuseEmptyElsewhere.id !== activeConversationId) {
      setError("");
      try {
        const messageCount = await loadConversation(parsedUserId, reuseEmptyElsewhere.id);
        setUiMode(messageCount === 0 ? "intro" : "chat");
      } catch (err) {
        console.error(err);
        setError("Khong tai duoc lich su hoi thoai.");
      }
      return;
    }

    setError("");
    setIsCreatingConversation(true);
    try {
      const response = await createConversation(parsedUserId, {
        provider,
        model,
      });
      const created = response.data;
      setConversations((prev) => [created, ...prev.filter((item) => item.id !== created.id)]);
      setActiveConversationId(created.id);
      setMessages([]);
      setUiMode("intro");
    } catch (err) {
      console.error(err);
      setError("Khong tao duoc cuoc tro chuyen moi.");
    } finally {
      setIsCreatingConversation(false);
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    if (!isValidUserId) {
      setError("User ID khong hop le.");
      return;
    }
    setIsDeletingConversation(true);
    setDeletingConversationId(conversationId);
    setError("");
    try {
      await deleteConversation(parsedUserId, conversationId);
      await refreshConversations(parsedUserId);
      if (activeConversationId === conversationId) {
        setActiveConversationId(null);
        setMessages([]);
        setUiMode("intro");
      }
    } catch (err) {
      console.error(err);
      setError("Khong xoa duoc cuoc tro chuyen.");
    } finally {
      setIsDeletingConversation(false);
      setDeletingConversationId(null);
    }
  };

  const handleSelectConversation = async (conversationId: string) => {
    if (!isValidUserId || isSending || isDeletingConversation) {
      return;
    }
    setError("");
    try {
      const messageCount = await loadConversation(parsedUserId, conversationId);
      setUiMode(messageCount === 0 ? "intro" : "chat");
    } catch (err) {
      console.error(err);
      setError("Khong tai duoc lich su hoi thoai.");
    }
  };

  const sendMessage = async () => {
    if (!bootstrapped) {
      setError("Hay ket noi AI workspace truoc khi chat.");
      return;
    }
    if (!isValidUserId) {
      setError("User ID khong hop le.");
      return;
    }
    if (isDeletingConversation) {
      return;
    }
    if (!input.trim()) {
      return;
    }
    if (uiMode === "intro") {
      setUiMode("chat");
    }

    const userMessage: UiMessage = {
      id: toMessageId(),
      role: "user",
      content: input.trim(),
    };
    const previousMessages = messages;
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsSending(true);
    setError("");

    try {
      let conversationId = activeConversationId;
      if (!conversationId) {
        const createdConversation = await createConversation(parsedUserId, {
          provider,
          model,
          first_user_message: userMessage.content,
        });
        conversationId = createdConversation.data.id;
        setActiveConversationId(conversationId);
      }

      const history: ChatHistoryMessage[] = previousMessages.map((item) => ({
        role: item.role,
        content: item.content,
      }));
      const response = await sendChatMessage({
        user_id: parsedUserId,
        conversation_id: conversationId,
        message: userMessage.content,
        history,
        provider,
        model,
      });
      setMessages((prev) => [
        ...prev,
        {
          id: toMessageId(),
          role: "assistant",
          content: response.data.answer,
        },
      ]);
      setProvider(response.data.resolved_provider);
      setModel(response.data.resolved_model);
      await refreshConversations(parsedUserId);
    } catch (err) {
      console.error(err);
      setError("Chatbot tam thoi khong phan hoi duoc. Vui long thu lai.");
      setMessages((prev) => [
        ...prev,
        {
          id: toMessageId(),
          role: "assistant",
          content:
            "He thong dang gap su co khi goi provider/model hoac backend. Ban thu lai sau.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    void bootstrap();
    // Intentionally bootstrap once for AI-first entry experience.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Layout
      mode="chatFirst"
      sidebarHistoryContent={({ collapsed }) => (
        <ConversationHistoryList
          conversations={conversations}
          activeConversationId={activeConversationId}
          onCreateConversation={createNewConversation}
          onSelectConversation={handleSelectConversation}
          onDeleteConversation={handleDeleteConversation}
          disableCreate={isCreatingConversation || isSending || isDeletingConversation}
          creating={isCreatingConversation}
          disableDelete={isDeletingConversation || isSending}
          deletingConversationId={deletingConversationId}
          collapsed={collapsed}
        />
      )}
      sidebarToolsContent={({ collapsed }) => (
        <ToolsSection
          items={toolsForSidebar}
          activePath={location.pathname}
          onNavigate={(path) => navigate(path)}
          collapsed={collapsed}
        />
      )}
    >
      <Stack spacing={1.5} sx={{ height: "calc(100vh - 108px)" }}>
        <Box sx={{ px: { xs: 0.4, sm: 0.8 } }}>
          <Chip
            label="LearningDB AI Workspace"
            sx={{
              bgcolor: "rgba(11,110,230,0.12)",
              color: "primary.main",
              fontWeight: 700,
            }}
          />
        </Box>

        <Paper
          sx={{
            p: { xs: 1.2, sm: 1.8 },
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            height: "100%",
            position: "relative",
            borderRadius: 3,
            background:
              "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(245,249,255,0.96) 100%)",
          }}
        >
          <Box sx={{ position: "absolute", top: { xs: 10, sm: 12 }, right: { xs: 10, sm: 12 }, zIndex: 2 }}>
            <ChatHeader
              userId={userId}
              onUserIdChange={setUserId}
              provider={provider}
              model={model}
              providers={providers}
              models={models}
              bootstrapped={bootstrapped}
              isBootstrapping={isBootstrapping}
              isSavingPreference={isSavingPreference}
              onBootstrap={bootstrap}
              onProviderChange={handleProviderChange}
              onModelChange={handleModelChange}
            />
          </Box>
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
        </Paper>
      </Stack>
    </Layout>
  );
}
