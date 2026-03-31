export type UiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
};

export type ConversationSummary = {
  id: string;
  user_id: number;
  title: string;
  provider: string;
  model: string;
  created_at: string;
  updated_at: string;
  last_message_at: string;
};
