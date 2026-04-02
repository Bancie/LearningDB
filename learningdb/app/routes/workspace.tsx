import Layout from "~/components/Layout";
import { Box, Stack, type SelectChangeEvent } from "@mui/material";
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
import { Outlet, useLocation, useNavigate } from "react-router";
import ConversationHistoryList from "~/components/chat/ConversationHistoryList";
import ToolsSection from "~/components/chat/ToolsSection";
import { menuItems } from "~/components/Layout";
import type { UiMessage } from "~/components/chat/types";
import type { WorkspaceOutletContext } from "~/workspace-context";

const toMessageId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;

function pickNewestEmptyConversation(
  items: ConversationSummary[],
): ConversationSummary | undefined {
  const empties = items.filter((c) => !c.last_message_at);
  if (empties.length === 0) {
    return undefined;
  }
  return empties.reduce((a, b) =>
    Date.parse(a.updated_at) >= Date.parse(b.updated_at) ? a : b,
  );
}

export default function Workspace() {
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
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [isDeletingConversation, setIsDeletingConversation] = useState(false);
  const [deletingConversationId, setDeletingConversationId] = useState<
    string | null
  >(null);
  const [error, setError] = useState("");
  const [uiMode, setUiMode] = useState<"intro" | "chat">("intro");

  const selectedProvider = useMemo(
    () => providers.find((item) => item.id === provider),
    [providers, provider],
  );
  const models = selectedProvider?.models ?? [];

  const parsedUserId = Number(userId);
  const isValidUserId = Number.isFinite(parsedUserId) && parsedUserId > 0;
  const toolsForSidebar = menuItems.filter((item) => item.path !== "/");

  const isChatIndexRoute =
    location.pathname === "/" || location.pathname === "";

  /** When on a tool route, switch main panel to chat (index) so chat actions match the visible UI. */
  const navigateToChatIfNeeded = () => {
    if (!isChatIndexRoute) {
      navigate("/");
    }
  };

  const refreshConversations = async (nextUserId: number) => {
    const conversationRes = await listConversations(nextUserId);
    setConversations(conversationRes.data);
    return conversationRes.data;
  };

  const loadConversation = async (
    nextUserId: number,
    conversationId: string,
  ) => {
    const messageRes = await getConversationMessages(
      nextUserId,
      conversationId,
    );
    /** Same-second inserts share CREATED_AT; tie-break so user precedes assistant. */
    const sorted = [...messageRes.data].sort((a, b) => {
      const ta = new Date(a.created_at ?? 0).getTime();
      const tb = new Date(b.created_at ?? 0).getTime();
      if (ta !== tb) {
        return ta - tb;
      }
      const roleRank = (r: string) => (r === "user" ? 0 : 1);
      return roleRank(a.role) - roleRank(b.role);
    });
    setActiveConversationId(conversationId);
    setMessages(
      sorted.map((item) => ({
        id: item.id,
        role: item.role,
        content: item.content,
        createdAt: item.created_at,
      })),
    );
    return sorted.length;
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
        const firstProvider =
          providerData.find((item) => item.available) ?? providerData[0];
        const firstModel =
          firstProvider?.models.find((item) => item.available) ??
          firstProvider?.models[0];
        if (firstProvider?.id) {
          setProvider(firstProvider.id);
        }
        if (firstModel?.id) {
          setModel(firstModel.id);
        }
      }

      if (conversationRes.data.length > 0) {
        const messageCount = await loadConversation(
          parsedUserId,
          conversationRes.data[0].id,
        );
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
    const uid = Number(userId);
    if (!Number.isFinite(uid) || uid <= 0) {
      return;
    }
    setIsSavingPreference(true);
    try {
      await putChatPreference(uid, nextProvider, nextModel);
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
    const nextProviderEntry = providers.find(
      (item) => item.id === nextProvider,
    );
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

    navigateToChatIfNeeded();

    const shouldReuseCurrentConversation =
      messages.length === 0 &&
      !isSending &&
      (Boolean(activeConversationId) ||
        uiMode === "intro" ||
        input.trim().length > 0);
    if (shouldReuseCurrentConversation) {
      return;
    }

    let listForReuse = conversations;
    try {
      listForReuse = await refreshConversations(parsedUserId);
    } catch {
      // keep stale conversations
    }
    const reuseEmptyElsewhere = pickNewestEmptyConversation(listForReuse);
    if (
      reuseEmptyElsewhere &&
      reuseEmptyElsewhere.id !== activeConversationId
    ) {
      setError("");
      try {
        const messageCount = await loadConversation(
          parsedUserId,
          reuseEmptyElsewhere.id,
        );
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
      setConversations((prev) => [
        created,
        ...prev.filter((item) => item.id !== created.id),
      ]);
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
    navigateToChatIfNeeded();
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

  /** Logo / "LearningDB" in app bar: go to chat home and same flow as New chat (intro + new thread). */
  const handleBrandClick = () => {
    setInput("");
    setError("");
    void createNewConversation();
  };

  useEffect(() => {
    void bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const outletContext: WorkspaceOutletContext = {
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
    conversations,
    activeConversationId,
    messages,
    input,
    setInput,
    isSending,
    isCreatingConversation,
    isDeletingConversation,
    deletingConversationId,
    error,
    uiMode,
    createNewConversation,
    handleDeleteConversation,
    handleSelectConversation,
    sendMessage,
  };

  return (
    <Layout
      mode="chatFirst"
      onBrandClick={handleBrandClick}
      sidebarHistoryContent={({ collapsed, closeMobileDrawer }) => (
        <ConversationHistoryList
          conversations={conversations}
          activeConversationId={activeConversationId}
          onCreateConversation={createNewConversation}
          onSelectConversation={handleSelectConversation}
          onDeleteConversation={handleDeleteConversation}
          disableCreate={
            isCreatingConversation || isSending || isDeletingConversation
          }
          creating={isCreatingConversation}
          disableDelete={isDeletingConversation || isSending}
          deletingConversationId={deletingConversationId}
          collapsed={collapsed}
          onCloseMobileDrawer={closeMobileDrawer}
        />
      )}
      sidebarToolsContent={({ collapsed, closeMobileDrawer }) => (
        <ToolsSection
          items={toolsForSidebar}
          activePath={location.pathname}
          onNavigate={(path) => navigate(path)}
          collapsed={collapsed}
          onCloseMobileDrawer={closeMobileDrawer}
        />
      )}
    >
      <Stack
        spacing={0}
        sx={{ height: "calc(100vh - 108px)", minHeight: 0, minWidth: 0, width: "100%" }}
      >
        {isChatIndexRoute ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
              minWidth: 0,
              flex: 1,
              width: "100%",
              height: "100%",
              pb: { xs: 1, sm: 1.25 },
            }}
          >
            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                minWidth: 0,
                overflow: "hidden",
                height: "100%",
              }}
            >
              <Outlet context={outletContext} />
            </Box>
          </Box>
        ) : (
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              overflow: "auto",
              bgcolor: "background.default",
              width: "100%",
              py: { xs: 0.5, sm: 1 },
            }}
          >
            <Outlet context={outletContext} />
          </Box>
        )}
      </Stack>
    </Layout>
  );
}
