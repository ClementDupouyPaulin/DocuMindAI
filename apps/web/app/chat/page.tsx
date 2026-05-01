"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import {
  getConversation,
  listConversations,
  listDocuments,
  queryChat,
} from "@/lib/api";
import type {
  ChatResponse,
  Conversation,
  DocumentItem,
  Source,
} from "@/types/api";

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
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [minScore, setMinScore] = useState(0);
  const [activeSource, setActiveSource] = useState<Source | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingConversationId, setLoadingConversationId] = useState<
    string | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  async function refreshConversations() {
    const data = await listConversations();
    setConversations(data);
  }

  async function refreshIndexedDocuments() {
    const docs = await listDocuments();
    setDocuments(docs.filter((document) => document.status === "INDEXED"));
  }

  useEffect(() => {
    Promise.all([refreshConversations(), refreshIndexedDocuments()]).catch(
      (err) => {
        setError(err instanceof Error ? err.message : "Erreur chargement.");
      }
    );
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function loadConversation(id: string) {
    setError(null);
    setLoadingConversationId(id);
    setActiveSource(null);

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
      setError(
        err instanceof Error ? err.message : "Erreur chargement conversation."
      );
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
    setActiveSource(null);

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
        document_ids:
          selectedDocumentIds.length > 0 ? selectedDocumentIds : null,
        min_score: minScore,
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
    setActiveSource(null);
  }

  function toggleDocumentSelection(documentId: string, checked: boolean) {
    if (checked) {
      setSelectedDocumentIds((current) => [...current, documentId]);
      return;
    }

    setSelectedDocumentIds((current) =>
      current.filter((id) => id !== documentId)
    );
  }

  return (
    <AppShell>
      <div className="grid h-[calc(100vh-160px)] gap-6 lg:grid-cols-[280px_minmax(0,1fr)_360px]">
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
                    : new Date(conversation.updated_at).toLocaleString(
                        "fr-FR"
                      )}
                </p>
              </button>
            ))}
          </div>
        </aside>

        <section className="flex min-h-0 flex-col rounded-2xl border border-slate-800 bg-slate-900">
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

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5 [scrollbar-color:#334155_transparent] [scrollbar-width:thin]">
            {messages.length === 0 && (
              <div className="flex min-h-[360px] items-center justify-center text-center text-slate-400">
                <div>
                  <p className="text-lg font-medium text-slate-300">
                    Commence une question
                  </p>
                  <p className="mt-2 text-sm">
                    Exemple : “Résume ce document” ou “Quels sont les points
                    importants ?”
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
                        <button
                          key={source.chunk_id}
                          onClick={() => setActiveSource(source)}
                          className="w-full rounded-lg border border-slate-800 bg-slate-900 p-3 text-left hover:border-blue-500/50"
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
                        </button>
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

          <form
            onSubmit={handleSubmit}
            className="shrink-0 border-t border-slate-800 p-5"
          >
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
          <h2 className="font-semibold">Filtres RAG</h2>

          <div className="mt-4 space-y-4">
            <div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-slate-300">
                  Documents utilisés
                </p>

                <button
                  onClick={() => setSelectedDocumentIds([])}
                  className="text-xs text-slate-500 hover:text-slate-300"
                >
                  Tout désélectionner
                </button>
              </div>

              <p className="mt-1 text-xs text-slate-500">
                Si aucun document n’est sélectionné, DocuMind cherche dans tous
                les documents indexés.
              </p>

              <div className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
                {documents.length === 0 && (
                  <p className="text-sm text-slate-500">
                    Aucun document indexé.
                  </p>
                )}

                {documents.map((document) => (
                  <label
                    key={document.id}
                    className="flex cursor-pointer items-start gap-2 rounded-lg border border-slate-800 bg-slate-950 p-3 text-sm hover:bg-slate-800"
                  >
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={selectedDocumentIds.includes(document.id)}
                      onChange={(event) =>
                        toggleDocumentSelection(
                          document.id,
                          event.target.checked
                        )
                      }
                    />

                    <span className="min-w-0">
                      <span className="block truncate font-medium text-slate-200">
                        {document.title}
                      </span>
                      <span className="block truncate text-xs text-slate-500">
                        {document.filename}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <label className="block">
              <span className="text-sm font-medium text-slate-300">
                Score minimum : {minScore.toFixed(2)}
              </span>

              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={minScore}
                onChange={(event) => setMinScore(Number(event.target.value))}
                className="mt-2 w-full"
              />

              <p className="mt-1 text-xs text-slate-500">
                Plus le score est élevé, plus les sources doivent être proches
                de la question.
              </p>
            </label>
          </div>

          <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-4">
            <p className="text-sm font-semibold text-slate-300">
              Source sélectionnée
            </p>

            {!activeSource && (
              <p className="mt-3 text-sm text-slate-500">
                Clique sur une source dans une réponse pour voir l’extrait
                complet.
              </p>
            )}

            {activeSource && (
              <div className="mt-3">
                <p className="text-sm font-medium text-slate-200">
                  {activeSource.title}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {activeSource.filename} · chunk {activeSource.chunk_index}
                  {activeSource.page_number
                    ? ` · page ${activeSource.page_number}`
                    : ""}
                </p>

                <p className="mt-3 max-h-80 overflow-y-auto whitespace-pre-wrap rounded-lg border border-slate-800 bg-slate-900 p-3 text-xs leading-5 text-slate-300">
                  {activeSource.content}
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </AppShell>
  );
}