import { clearAccessToken, getAccessToken } from "./auth";
import type {
  AiStatus,
  AuthResponse,
  ChatResponse,
  Conversation,
  ConversationDetail,
  DashboardStats,
  DocumentItem,
  User,
} from "@/types/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function redirectToLoginIfBrowser() {
  if (typeof window !== "undefined") {
    clearAccessToken();
    window.location.href = "/login";
  }
}

function formatApiError(message: string): string {
  if (
    message.includes("insufficient_quota") ||
    message.includes("exceeded your current quota") ||
    message.includes("429")
  ) {
    return "Quota OpenAI insuffisant ou limite atteinte. Vérifie ton billing/API key.";
  }

  if (message.includes("OpenAI API key is not configured")) {
    return "Clé OpenAI non configurée côté backend.";
  }

  return message;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  authenticated = false
): Promise<T> {
  const headers = new Headers(options.headers);

  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (authenticated) {
    const token = getAccessToken();

    if (!token) {
      redirectToLoginIfBrowser();
      throw new Error("Utilisateur non connecté.");
    }

    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    redirectToLoginIfBrowser();
    throw new Error("Session expirée. Reconnecte-toi.");
  }

  if (!response.ok) {
    let message = `Erreur API ${response.status}`;

    try {
      const data = await response.json();
      message = data.detail ?? message;
    } catch {
      // Ignore non-JSON errors
    }

    throw new Error(formatApiError(String(message)));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function registerUser(payload: {
  email: string;
  password: string;
  full_name?: string;
}): Promise<AuthResponse> {
  return request<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function loginUser(payload: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  return request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getMe(): Promise<User> {
  return request<User>("/auth/me", {}, true);
}

export function listDocuments(): Promise<DocumentItem[]> {
  return request<DocumentItem[]>("/documents", {}, true);
}

export function uploadDocument(file: File, title?: string): Promise<DocumentItem> {
  const formData = new FormData();
  formData.append("file", file);

  if (title) {
    formData.append("title", title);
  }

  return request<DocumentItem>(
    "/documents/upload",
    {
      method: "POST",
      body: formData,
    },
    true
  );
}

export function indexDocument(documentId: string): Promise<DocumentItem> {
  return request<DocumentItem>(
    `/documents/${documentId}/index`,
    {
      method: "POST",
    },
    true
  );
}

export function deleteDocument(documentId: string): Promise<void> {
  return request<void>(
    `/documents/${documentId}`,
    {
      method: "DELETE",
    },
    true
  );
}

export function queryChat(payload: {
  question: string;
  conversation_id?: string | null;
  top_k?: number;
  document_ids?: string[] | null;
  min_score?: number;
}): Promise<ChatResponse> {
  return request<ChatResponse>(
    "/chat/query",
    {
      method: "POST",
      body: JSON.stringify({
        question: payload.question,
        conversation_id: payload.conversation_id ?? null,
        top_k: payload.top_k ?? 5,
        document_ids: payload.document_ids ?? null,
        min_score: payload.min_score ?? 0,
      }),
    },
    true
  );
}

export function listConversations(): Promise<Conversation[]> {
  return request<Conversation[]>("/conversations", {}, true);
}

export function getConversation(
  conversationId: string
): Promise<ConversationDetail> {
  return request<ConversationDetail>(
    `/conversations/${conversationId}`,
    {},
    true
  );
}

export function getDashboardStats(): Promise<DashboardStats> {
  return request<DashboardStats>("/stats/dashboard", {}, true);
}

export function getAiStatus(): Promise<AiStatus> {
  return request<AiStatus>("/health/ai");
}