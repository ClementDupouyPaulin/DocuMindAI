"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import {
  deleteDocument,
  indexDocument,
  listDocuments,
  uploadDocument,
} from "@/lib/api";
import type { DocumentItem } from "@/types/api";

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

  if (errorMessage.length > 240) {
    return `${errorMessage.slice(0, 240)}...`;
  }

  return errorMessage;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function refreshDocuments() {
    const docs = await listDocuments();
    setDocuments(docs);
  }

  useEffect(() => {
    refreshDocuments().catch((err) => {
      setError(err instanceof Error ? err.message : "Erreur de chargement.");
    });
  }, []);

  async function pollDocumentIndexing(documentId: string) {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      await delay(1500);

      const docs = await listDocuments();
      setDocuments(docs);

      const targetDocument = docs.find((document) => document.id === documentId);

      if (!targetDocument) {
        return;
      }

      if (targetDocument.status !== "PROCESSING") {
        return;
      }
    }
  }

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;

    if (!file) {
      setError("Choisis un fichier PDF, TXT ou DOCX.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await uploadDocument(file, title || undefined);

      setTitle("");
      setFile(null);
      form.reset();

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      await refreshDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur upload.");
    } finally {
      setLoading(false);
    }
  }

  async function handleIndex(documentId: string) {
    setError(null);
    setActionLoadingId(documentId);

    try {
      await indexDocument(documentId);
      await refreshDocuments();
      await pollDocumentIndexing(documentId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur indexation.");
      await refreshDocuments();
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleDelete(documentId: string) {
    setError(null);
    setActionLoadingId(documentId);

    try {
      await deleteDocument(documentId);
      await refreshDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur suppression.");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function deleteFailedDocuments() {
    const failedDocuments = documents.filter(
      (document) => document.status === "FAILED"
    );

    if (failedDocuments.length === 0) {
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await Promise.all(
        failedDocuments.map((document) => deleteDocument(document.id))
      );

      await refreshDocuments();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur pendant la suppression des documents en erreur."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h1 className="text-2xl font-bold">Documents</h1>
          <p className="mt-2 text-sm text-slate-400">
            Importe tes fichiers, puis lance l’indexation RAG.
          </p>

          {error && (
            <div className="mt-6 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleUpload} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-sm text-slate-300">Titre optionnel</span>
              <input
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-blue-500"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Ex : Règlement formation"
              />
            </label>

            <label className="block">
              <span className="text-sm text-slate-300">Fichier PDF/TXT/DOCX</span>

              <div className="mt-1 flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  id="document-file"
                  className="hidden"
                  type="file"
                  accept=".pdf,.txt,.docx"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                />

                <label
                  htmlFor="document-file"
                  className="shrink-0 cursor-pointer rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 hover:bg-slate-800"
                >
                  Choisir un fichier
                </label>

                <span className="min-w-0 flex-1 truncate rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-400">
                  {file ? file.name : "Aucun fichier choisi"}
                </span>
              </div>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Upload..." : "Uploader le document"}
            </button>
          </form>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold">Mes documents</h2>
              <p className="text-sm text-slate-400">
                {documents.length} document(s)
              </p>
            </div>

            <div className="flex items-center gap-2">
              {documents.some((document) => document.status === "FAILED") && (
                <button
                  onClick={deleteFailedDocuments}
                  disabled={loading}
                  className="rounded-lg border border-red-500/40 px-3 py-2 text-sm text-red-300 hover:bg-red-500/10 disabled:opacity-60"
                >
                  Supprimer les erreurs
                </button>
              )}

              <button
                onClick={() => refreshDocuments()}
                className="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800"
              >
                Rafraîchir
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {documents.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-700 p-8 text-center text-slate-400">
                Aucun document pour le moment.
              </div>
            )}

            {documents.map((document) => (
              <article
                key={document.id}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-lg font-semibold">
                        {document.title}
                      </h3>

                      <span
                        className={`rounded-full border px-2 py-1 text-xs font-semibold ${getStatusClassName(
                          document.status
                        )}`}
                      >
                        {getStatusLabel(document.status)}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-slate-400">
                      {document.filename} · {document.file_type} ·{" "}
                      {formatFileSize(document.file_size)}
                    </p>

                    {document.status === "FAILED" && document.error_message && (
                      <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
                        <p className="text-sm font-medium text-red-300">
                          Échec de l’indexation
                        </p>
                        <p className="mt-1 text-sm leading-5 text-red-200">
                          {formatDocumentError(document.error_message)}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => handleIndex(document.id)}
                      disabled={
                        actionLoadingId === document.id ||
                        document.status === "PROCESSING"
                      }
                      className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {document.status === "PROCESSING"
                        ? "Indexation..."
                        : actionLoadingId === document.id
                          ? "Action..."
                          : document.status === "FAILED"
                            ? "Réessayer"
                            : document.status === "INDEXED"
                              ? "Réindexer"
                              : "Indexer"}
                    </button>

                    <button
                      onClick={() => handleDelete(document.id)}
                      disabled={actionLoadingId === document.id}
                      className="rounded-lg border border-red-500/40 px-3 py-2 text-sm text-red-300 hover:bg-red-500/10 disabled:opacity-60"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}