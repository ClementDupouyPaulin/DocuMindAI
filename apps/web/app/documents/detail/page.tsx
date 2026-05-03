"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import {
  deleteDocument,
  generateDocumentSummary,
  getDocument,
  getDocumentSummary,
  indexDocument,
  listDocumentChunks,
} from "@/lib/api";
import type { DocumentChunk, DocumentItem, DocumentSummary } from "@/types/api";

function formatFileSize(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function getStatusLabel(status: string): string {
  if (status === "UPLOADED") return "À indexer";
  if (status === "PROCESSING") return "Indexation";
  if (status === "INDEXED") return "Indexé";
  if (status === "FAILED") return "Erreur";
  return status;
}

function getStatusClassName(status: string): string {
  if (status === "INDEXED") {
    return "border-emerald-500/40 bg-emerald-500/10 text-emerald-300";
  }

  if (status === "PROCESSING") {
    return "border-yellow-500/40 bg-yellow-500/10 text-yellow-300";
  }

  if (status === "FAILED") {
    return "border-red-500/40 bg-red-500/10 text-red-300";
  }

  return "border-slate-500/40 bg-slate-500/10 text-slate-300";
}

function formatDocumentError(errorMessage?: string | null): string {
  if (!errorMessage) {
    return "Erreur inconnue pendant l’indexation.";
  }

  if (
    errorMessage.includes("insufficient_quota") ||
    errorMessage.includes("exceeded your current quota") ||
    errorMessage.includes("Quota OpenAI")
  ) {
    return "Quota OpenAI insuffisant ou limite atteinte. Vérifie ton billing OpenAI.";
  }

  if (errorMessage.includes("OpenAI API key is not configured")) {
    return "Clé OpenAI non configurée côté backend.";
  }

  if (errorMessage.includes("invalid_api_key") || errorMessage.includes("401")) {
    return "Clé OpenAI invalide ou non autorisée.";
  }

  if (errorMessage.length > 500) {
    return `${errorMessage.slice(0, 500)}...`;
  }

  return errorMessage;
}

function StatBox({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 font-semibold text-slate-100">{value}</p>
    </div>
  );
}

function DocumentDetailContent() {
  const searchParams = useSearchParams();
  const documentId = searchParams.get("documentId");

  const [document, setDocument] = useState<DocumentItem | null>(null);
  const [chunks, setChunks] = useState<DocumentChunk[]>([]);
  const [summary, setSummary] = useState<DocumentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const totalTokens = useMemo(() => {
    return chunks.reduce((sum, chunk) => sum + (chunk.token_count || 0), 0);
  }, [chunks]);

  async function loadDocumentDetail() {
    if (!documentId) {
      setError("Identifiant du document manquant.");
      setLoading(false);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const [documentData, chunkData, savedSummary] = await Promise.all([
        getDocument(documentId),
        listDocumentChunks(documentId),
        getDocumentSummary(documentId),
      ]);

      setDocument(documentData);
      setChunks(chunkData);
      setSummary(savedSummary);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur pendant le chargement du document."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDocumentDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  async function handleReindex() {
    if (!documentId) return;

    setActionLoading(true);
    setError(null);

    try {
      await indexDocument(documentId);
      await loadDocumentDetail();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur indexation.");
      await loadDocumentDetail();
    } finally {
      setActionLoading(false);
    }
  }

  async function handleGenerateSummary(force = false) {
    if (!documentId) return;

    setSummaryLoading(true);
    setError(null);
    setCopyFeedback(null);

    try {
      const generatedSummary = await generateDocumentSummary(documentId, force);
      setSummary(generatedSummary);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur pendant la génération du résumé."
      );
    } finally {
      setSummaryLoading(false);
    }
  }

  async function handleCopySummary() {
    if (!summary) return;

    await navigator.clipboard.writeText(summary.summary);
    setCopyFeedback("Résumé copié.");
  }

  function handleExportSummary() {
    if (!summary || !document) return;

    const content = `# Résumé — ${document.title}

Document : ${document.filename}
Provider : ${summary.provider}
Chunks utilisés : ${summary.chunks_used}
Généré le : ${
      summary.created_at
        ? new Date(summary.created_at).toLocaleString("fr-FR")
        : "date inconnue"
    }

---

${summary.summary}
`;

    const blob = new Blob([content], {
      type: "text/markdown;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = window.document.createElement("a");

    link.href = url;
    link.download = `${document.title.replaceAll(" ", "_")}_resume.md`;
    link.click();

    URL.revokeObjectURL(url);
  }

  async function handleDelete() {
    if (!documentId) return;

    setActionLoading(true);
    setError(null);

    try {
      await deleteDocument(documentId);
      window.location.href = "/documents";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur suppression.");
      setActionLoading(false);
    }
  }

  return (
    <AppShell>
      <div>
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <Link
              href="/documents"
              className="text-sm text-blue-300 hover:text-blue-200"
            >
              ← Retour aux documents
            </Link>

            <h1 className="mt-3 text-3xl font-bold">Détail du document</h1>
            <p className="mt-2 text-slate-400">
              Métadonnées, statut d’indexation, résumé et chunks extraits.
            </p>
          </div>

          <button
            onClick={loadDocumentDetail}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
          >
            Rafraîchir
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {loading && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-400">
            Chargement du document...
          </div>
        )}

        {!loading && document && (
          <>
            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="truncate text-2xl font-bold">
                      {document.title}
                    </h2>

                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClassName(
                        document.status
                      )}`}
                    >
                      {getStatusLabel(document.status)}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-slate-400">
                    {document.filename} · {document.file_type} ·{" "}
                    {formatFileSize(document.file_size)}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  <button
                    onClick={() => handleGenerateSummary(Boolean(summary))}
                    disabled={summaryLoading || chunks.length === 0}
                    className="rounded-lg border border-blue-500/40 px-4 py-2 text-sm text-blue-300 hover:bg-blue-500/10 disabled:opacity-60"
                  >
                    {summaryLoading
                      ? "Résumé..."
                      : summary
                        ? "Régénérer le résumé"
                        : "Générer un résumé"}
                  </button>

                  <button
                    onClick={handleReindex}
                    disabled={actionLoading || document.status === "PROCESSING"}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {document.status === "PROCESSING"
                      ? "Indexation..."
                      : actionLoading
                        ? "Action..."
                        : document.status === "INDEXED"
                          ? "Réindexer"
                          : "Indexer"}
                  </button>

                  <button
                    onClick={handleDelete}
                    disabled={actionLoading}
                    className="rounded-lg border border-red-500/40 px-4 py-2 text-sm text-red-300 hover:bg-red-500/10 disabled:opacity-60"
                  >
                    Supprimer
                  </button>
                </div>
              </div>

              {document.status === "FAILED" && document.error_message && (
                <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
                  <p className="text-sm font-semibold text-red-300">
                    Échec de l’indexation
                  </p>
                  <p className="mt-2 text-sm leading-6 text-red-200">
                    {formatDocumentError(document.error_message)}
                  </p>
                </div>
              )}

              <div className="mt-6 grid gap-4 md:grid-cols-4">
                <StatBox label="Statut" value={getStatusLabel(document.status)} />
                <StatBox label="Chunks" value={chunks.length} />
                <StatBox label="Tokens estimés" value={totalTokens} />
                <StatBox
                  label="Créé le"
                  value={new Date(document.created_at).toLocaleDateString(
                    "fr-FR"
                  )}
                />
              </div>
            </section>

            <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
                <div>
                  <h2 className="text-2xl font-bold">Résumé automatique</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Génère une synthèse du document à partir des chunks indexés.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {summary && (
                    <>
                      <button
                        onClick={handleCopySummary}
                        className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
                      >
                        Copier
                      </button>

                      <button
                        onClick={handleExportSummary}
                        className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
                      >
                        Exporter .md
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => handleGenerateSummary(Boolean(summary))}
                    disabled={summaryLoading || chunks.length === 0}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {summaryLoading
                      ? "Génération..."
                      : summary
                        ? "Régénérer"
                        : "Générer"}
                  </button>
                </div>
              </div>

              {copyFeedback && (
                <p className="mt-4 text-sm text-emerald-300">{copyFeedback}</p>
              )}

              {!summary && !summaryLoading && (
                <div className="mt-6 rounded-xl border border-dashed border-slate-700 p-8 text-center text-slate-400">
                  Aucun résumé généré pour le moment.
                </div>
              )}

              {summaryLoading && (
                <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-6 text-slate-400">
                  Génération du résumé en cours...
                </div>
              )}

              {summary && (
                <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-5">
                  <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span>{summary.chunks_used} chunk(s) utilisés</span>
                    <span>·</span>
                    <span>Provider : {summary.provider}</span>
                    <span>·</span>
                    <span>
                      Généré le{" "}
                      {summary.created_at
                        ? new Date(summary.created_at).toLocaleString("fr-FR")
                        : "date inconnue"}
                    </span>
                  </div>

                  <p className="whitespace-pre-wrap text-sm leading-7 text-slate-200">
                    {summary.summary}
                  </p>
                </div>
              )}
            </section>

            <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
                <div>
                  <h2 className="text-2xl font-bold">Chunks extraits</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Fragments utilisés pour la recherche vectorielle et le chat
                    RAG.
                  </p>
                </div>

                <span className="text-sm text-slate-500">
                  {chunks.length} chunk(s)
                </span>
              </div>

              {chunks.length === 0 && (
                <div className="mt-6 rounded-xl border border-dashed border-slate-700 p-8 text-center text-slate-400">
                  Aucun chunk disponible. Lance l’indexation du document.
                </div>
              )}

              {chunks.length > 0 && (
                <div className="mt-6 space-y-4">
                  {chunks.map((chunk) => (
                    <article
                      key={chunk.id}
                      className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-slate-200">
                          Chunk #{chunk.chunk_index}
                        </p>

                        <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                          {chunk.page_number && (
                            <span>Page {chunk.page_number}</span>
                          )}
                          <span>{chunk.token_count} token(s)</span>
                        </div>
                      </div>

                      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-300">
                        {chunk.content}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}

export default function DocumentDetailPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-400">
            Chargement du document...
          </div>
        </AppShell>
      }
    >
      <DocumentDetailContent />
    </Suspense>
  );
}