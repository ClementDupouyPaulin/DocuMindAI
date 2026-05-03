"use client";

import { FormEvent, Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import {
  deleteConversation,
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

function ChatContent() {
  const searchParams = useSearchParams();
  const initialDocumentId = searchParams.get("documentId");

  const [question, setQuestion] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [minScore, setMinScore] = useState(0);
  const [topK, setTopK] = useState(5);
  const [activeSource, setActiveSource] = useState<Source | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingConversationId, setLoadingConversationId] = useState<
    string | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  async function refreshConversations() {
    const data = await listConversations();
    setConversations(data);
  }

  async function refreshIndexedDocuments() {
    const docs = await listDocuments();
    const indexedDocs = docs.filter((document) => document.status === "INDEXED");

    setDocuments(indexedDocs);

    if (
      initialDocumentId &&
      indexedDocs.some((document) => document.id === initialDocumentId)
    ) {
      setSelectedDocumentIds([initialDocumentId]);
    }
  }

  useEffect(() => {
    Promise.all([refreshConversations(), refreshIndexedDocuments()]).catch(
      (err) => {
        setError(err instanceof Error ? err.message : "Erreur chargement.");
      }
    );

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDocumentId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function loadConversation(id: string) {
    setError(null);
    setCopyFeedback(null);
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
    setCopyFeedback(null);
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
        top_k: topK,
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

  function clearCurrentChat() {
    setConversationId(null);
    setMessages([]);
    setQuestion("");
    setError(null);
    setCopyFeedback(null);
    setActiveSource(null);
  }

  function startNewConversation() {
    clearCurrentChat();
  }

  async function handleDeleteConversation(id: string) {
    setError(null);
    setCopyFeedback(null);

    try {
      await deleteConversation(id);

      if (conversationId === id) {
        setConversationId(null);
        setMessages([]);
        setActiveSource(null);
      }

      await refreshConversations();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur suppression conversation."
      );
    }
  }

  async function copyAssistantMessage(content: string) {
    await navigator.clipboard.writeText(content);
    setCopyFeedback("Réponse copiée.");
  }

  function toggleDocumentSelection(documentId: string, checked: boolean) {
    if (checked) {
      setSelectedDocumentIds((current) => {
        if (current.includes(documentId)) {
          return current;
        }

        return [...current, documentId];
      });

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

            <div className="flex gap-2">
              <button
                onClick={clearCurrentChat}
                className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800"
              >
                Vider
              </button>

              <button
                onClick={startNewConversation}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
              >
                Nouveau
              </button>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {conversations.length === 0 && (
              <p className="text-sm text-slate-400">Aucune conversation.</p>
            )}

            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`rounded-lg border p-2 ${
                  conversationId === conversation.id
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-slate-800"
                }`}
              >
                <button
                  onClick={() => loadConversation(conversation.id)}
                  className="w-full text-left text-sm"
                >
                  <p
                    className={`line-clamp-2 font-medium ${
                      conversationId === conversation.id
                        ? "text-blue-200"
                        : "text-slate-300"
                    }`}
                  >
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

                <button
                  onClick={() => handleDeleteConversation(conversation.id)}
                  className="mt-2 text-xs text-red-300 hover:text-red-200"
                >
                  Supprimer
                </button>
              </div>
            ))}
          </div>
        </aside>

        <section className="flex min-h-0 flex-col rounded-2xl border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 p-5">
            <h1 className="text-2xl font-bold">Chat documentaire</h1>

            <p className="mt-1 text-sm text-slate-400">
              Pose une question sur tes documents indexés.
            </p>

            <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Scope RAG
              </p>

              <p className="mt-1 text-sm text-slate-300">
                {selectedDocumentIds.length === 0
                  ? "Recherche dans tous les documents indexés."
                  : `Recherche limitée à ${selectedDocumentIds.length} document(s) sélectionné(s).`}
              </p>
            </div>
          </div>

          {error && (
            <div className="m-5 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {copyFeedback && (
            <div className="mx-5 mb-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-300">
              {copyFeedback}
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

                {message.role === "assistant" && (
                  <button
                    onClick={() => copyAssistantMessage(message.content)}
                    className="mt-3 rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
                  >
                    Copier la réponse
                  </button>
                )}

                {message.role === "assistant" &&
                  (!message.sources || message.sources.length === 0) && (
                    <div className="mt-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 text-xs text-yellow-200">
                      Aucune source n’a été retournée pour cette réponse. Essaie
                      de baisser le score minimum ou d’augmenter le nombre de
                      chunks récupérés.
                    </div>
                  )}

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
            <div className="mb-3 flex flex-wrap gap-2">
              {[
                "Résume ce document",
                "Quels sont les points clés ?",
                "Quelles notions importantes dois-je retenir ?",
              ].map((presetQuestion) => (
                <button
                  key={presetQuestion}
                  type="button"
                  onClick={() => setQuestion(presetQuestion)}
                  className="rounded-full border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
                >
                  {presetQuestion}
                </button>
              ))}
            </div>

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
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
              <p className="text-sm font-medium text-slate-300">
                Scope actuel
              </p>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                {selectedDocumentIds.length === 0
                  ? "Tous les documents indexés sont utilisés pour la recherche RAG."
                  : `${selectedDocumentIds.length} document(s) sélectionné(s). La réponse sera limitée à ces documents.`}
              </p>
            </div>

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

            <label className="block">
              <span className="text-sm font-medium text-slate-300">
                Nombre de chunks récupérés : {topK}
              </span>

              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={topK}
                onChange={(event) => setTopK(Number(event.target.value))}
                className="mt-2 w-full"
              />

              <p className="mt-1 text-xs text-slate-500">
                Plus la valeur est élevée, plus DocuMind récupère de contexte,
                mais les réponses peuvent être moins ciblées.
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

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-400">
            Chargement du chat...
          </div>
        </AppShell>
      }
    >
      <ChatContent />
    </Suspense>
  );
}