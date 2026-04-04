import type { ChatToolInvocation } from "~/services/orchestrator";

export type UiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
  toolInvocations?: ChatToolInvocation[];
};

export type ConversationSummary = {
  id: string;
  user_id: number;
  title: string;
  provider: string;
  model: string;
  created_at: string;
  updated_at: string;
  /** Null when no message has been sent yet (empty draft thread). */
  last_message_at: string | null;
};
