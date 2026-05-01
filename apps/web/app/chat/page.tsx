"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { getConversation, listConversations, queryChat } from "@/lib/api";
import type { ChatResponse, Conversation, Source } from "@/types/api";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
};

export default function ChatPage() {
  const [question, setQuestion] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingConversationId, setLoadingConversationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  async function refreshConversations() {
    const data = await listConversations();
    setConversations(data);
  }

  useEffect(() => {
    refreshConversations().catch((err) => {
      setError(err instanceof Error ? err.message : "Erreur conversations.");
    });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function loadConversation(id: string) {
    setError(null);
    setLoadingConversationId(id);

    try {
      const conversation = await getConversation(id);

      setConversationId(conversation.id);

      setMessages(
        conversation.messages.map((message) => ({
          role: message.role,
          content: message.content,
          sources: message.sources_json ?? undefined,
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur chargement conversation.");
    } finally {
      setLoadingConversationId(null);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedQuestion = question.trim();

    if (!trimmedQuestion) {
      return;
    }

    setError(null);
    setLoading(true);

    const userMessage: ChatMessage = {
      role: "user",
      content: trimmedQuestion,
    };

    setMessages((current) => [...current, userMessage]);
    setQuestion("");

    try {
      const response: ChatResponse = await queryChat({
        question: trimmedQuestion,
        conversation_id: conversationId,
        top_k: 5,
      });

      setConversationId(response.conversation_id);

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: response.answer,
          sources: response.sources,
        },
      ]);

      await refreshConversations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur chat.");
    } finally {
      setLoading(false);
    }
  }

  function startNewConversation() {
    setConversationId(null);
    setMessages([]);
    setError(null);
  }

  return (
    <AppShell>
      <div className="grid min-h-[calc(100vh-160px)] gap-6 lg:grid-cols-[280px_1fr_340px]">
        <aside className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold">Conversations</h2>
            <button
              onClick={startNewConversation}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
            >
              Nouveau
            </button>
          </div>

          <div className="mt-4 space-y-2">
            {conversations.length === 0 && (
              <p className="text-sm text-slate-400">Aucune conversation.</p>
            )}

            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => loadConversation(conversation.id)}
                className={`w-full rounded-lg border px-3 py-2 text-left text-sm hover:bg-slate-800 ${
                  conversationId === conversation.id
                    ? "border-blue-500 bg-blue-500/10 text-blue-200"
                    : "border-slate-800 text-slate-300"
                }`}
              >
                <p className="line-clamp-2 font-medium">
                  {conversation.title}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {loadingConversationId === conversation.id
                    ? "Chargement..."
                    : new Date(conversation.updated_at).toLocaleString("fr-FR")}
                </p>
              </button>
            ))}
          </div>
        </aside>

        <section className="flex min-h-[640px] flex-col rounded-2xl border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 p-5">
            <h1 className="text-2xl font-bold">Chat documentaire</h1>
            <p className="mt-1 text-sm text-slate-400">
              Pose une question sur tes documents indexés.
            </p>
          </div>

          {error && (
            <div className="m-5 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {messages.length === 0 && (
              <div className="flex h-full items-center justify-center text-center text-slate-400">
                <div>
                  <p className="text-lg font-medium text-slate-300">
                    Commence une question
                  </p>
                  <p className="mt-2 text-sm">
                    Exemple : “Résume ce document” ou “Quels sont les points importants ?”
                  </p>
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`rounded-2xl border p-4 ${
                  message.role === "user"
                    ? "ml-auto max-w-[80%] border-blue-500/30 bg-blue-500/10"
                    : "mr-auto max-w-[95%] border-slate-700 bg-slate-950"
                }`}
              >
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  {message.role === "user" ? "Vous" : "DocuMind AI"}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-100">
                  {message.content}
                </p>

                {message.sources && message.sources.length > 0 && (
                  <div className="mt-4 border-t border-slate-800 pt-3">
                    <p className="text-xs font-semibold text-slate-400">
                      Sources utilisées
                    </p>
                    <div className="mt-2 space-y-2">
                      {message.sources.map((source, sourceIndex) => (
                        <div
                          key={source.chunk_id}
                          className="rounded-lg border border-slate-800 bg-slate-900 p-3"
                        >
                          <p className="text-sm font-medium text-slate-200">
                            [source_{sourceIndex + 1}] {source.title}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {source.filename} · chunk {source.chunk_index}
                            {source.page_number
                              ? ` · page ${source.page_number}`
                              : ""}
                            {" · "}
                            score {source.score.toFixed(3)}
                          </p>
                          <p className="mt-2 text-xs leading-5 text-slate-400">
                            {source.content_preview}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="mr-auto max-w-[90%] rounded-2xl border border-slate-700 bg-slate-950 p-4 text-sm text-slate-400">
                DocuMind AI réfléchit...
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <form onSubmit={handleSubmit} className="border-t border-slate-800 p-5">
            <div className="flex gap-3">
              <textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Pose ta question..."
                className="min-h-24 flex-1 resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={loading || !question.trim()}
                className="self-end rounded-xl bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              >
                Envoyer
              </button>
            </div>
          </form>
        </section>

        <aside className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <h2 className="font-semibold">Conseils</h2>

          <div className="mt-4 space-y-3 text-sm text-slate-400">
            <p>
              Les réponses sont générées uniquement à partir des chunks retrouvés
              dans Qdrant.
            </p>
            <p>
              Pour de meilleurs résultats, indexe d’abord tes documents dans la
              page Documents.
            </p>
            <p>
              Les sources affichées permettent de vérifier les extraits utilisés
              par l’IA.
            </p>
          </div>

          <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-4">
            <p className="text-sm font-medium text-slate-300">
              Exemples de questions
            </p>
            <ul className="mt-3 space-y-2 text-sm text-slate-400">
              <li>• Résume le document.</li>
              <li>• Quels sont les points importants ?</li>
              <li>• Donne-moi les définitions clés.</li>
              <li>• Quelles sont les obligations mentionnées ?</li>
            </ul>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}