export type User = {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  created_at: string;
};

export type AuthResponse = {
  access_token: string;
  token_type: string;
  user: User;
};

export type DocumentItem = {
  id: string;
  user_id: string;
  title: string;
  filename: string;
  file_type: string;
  file_size: number;
  status: string;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

export type Source = {
  chunk_id: string;
  document_id: string;
  title: string;
  filename: string;
  page_number: number | null;
  chunk_index: number;
  score: number;
  content_preview: string;
  content: string;
};

export type ChatResponse = {
  conversation_id: string;
  answer: string;
  sources: Source[];
};

export type Conversation = {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  sources_json: Source[] | null;
  created_at: string;
};

export type ConversationDetail = Conversation & {
  messages: Message[];
};

export type DashboardStats = {
  total_documents: number;
  indexed_documents: number;
  processing_documents: number;
  failed_documents: number;
  total_chunks: number;
  total_conversations: number;
  total_messages: number;
};