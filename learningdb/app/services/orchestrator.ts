import axios from "axios";
import { resolveOrchestratorBaseUrl } from "./resolvePublicServiceUrls";

const ORCH_BASE_URL = resolveOrchestratorBaseUrl();

const orchestratorApi = axios.create({
  baseURL: ORCH_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export type ChatRole = "user" | "assistant" | "system";

export interface ChatHistoryMessage {
  role: ChatRole;
  content: string;
}

export interface ProviderModelItem {
  id: string;
  label: string;
  available: boolean;
}

export interface ProviderCatalogItem {
  id: string;
  label: string;
  available: boolean;
  models: ProviderModelItem[];
}

export interface ChatPreference {
  user_id: number;
  provider: string;
  model: string;
  updated_at?: string | null;
}

export interface ChatToolInvocation {
  name: string;
  status: "ok" | "error" | "blocked";
  input: Record<string, unknown>;
  source_endpoint: string;
  latency_ms: number;
  error?: string | null;
}

export interface ChatResponse {
  request_id: string;
  conversation_id: string;
  answer: string;
  resolved_provider: string;
  resolved_model: string;
  tool_invocations: ChatToolInvocation[];
  warnings: string[];
}

export interface ChatRequest {
  user_id: number;
  message: string;
  conversation_id?: string;
  history: ChatHistoryMessage[];
  provider?: string;
  model?: string;
}

export const getProviders = () =>
  orchestratorApi.get<ProviderCatalogItem[]>("/providers");

export const getChatPreference = (userId: number) =>
  orchestratorApi.get<ChatPreference | null>(`/chat/preferences/${userId}`);

export const putChatPreference = (
  userId: number,
  provider: string,
  model: string
) =>
  orchestratorApi.put<ChatPreference>(`/chat/preferences/${userId}`, {
    provider,
    model,
  });

export const sendChatMessage = (payload: ChatRequest) =>
  orchestratorApi.post<ChatResponse>("/chat", payload);

export interface ConversationSummary {
  id: string;
  user_id: number;
  title: string;
  provider: string;
  model: string;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
}

export interface ConversationMessage {
  id: string;
  conversation_id: string;
  user_id: number;
  role: "user" | "assistant";
  content: string;
  request_id: string | null;
  created_at: string;
}

export const listConversations = (userId: number) =>
  orchestratorApi.get<ConversationSummary[]>(`/chat/conversations/${userId}`);

export const createConversation = (
  userId: number,
  payload?: {
    title?: string;
    provider?: string;
    model?: string;
    first_user_message?: string;
  }
) => orchestratorApi.post<ConversationSummary>(`/chat/conversations/${userId}`, payload ?? {});

export interface DeletedConversationPayload {
  id: string;
  deleted_at: string | null;
}

export const deleteConversation = (userId: number, conversationId: string) =>
  orchestratorApi.delete<DeletedConversationPayload>(
    `/chat/conversations/${userId}/${conversationId}`
  );

export const getConversationMessages = (userId: number, conversationId: string) =>
  orchestratorApi.get<ConversationMessage[]>(
    `/chat/conversations/${userId}/${conversationId}/messages`
  );

export const appendConversationMessage = (
  userId: number,
  conversationId: string,
  payload: {
    role: "user" | "assistant";
    content: string;
    request_id?: string;
  }
) =>
  orchestratorApi.post<ConversationMessage>(
    `/chat/conversations/${userId}/${conversationId}/messages`,
    payload
  );

export default orchestratorApi;
