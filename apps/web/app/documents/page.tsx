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

function statusClass(status: string): string {
  switch (status) {
    case "INDEXED":
      return "bg-emerald-500/10 text-emerald-300 border-emerald-500/30";
    case "PROCESSING":
      return "bg-yellow-500/10 text-yellow-300 border-yellow-500/30";
    case "FAILED":
      return "bg-red-500/10 text-red-300 border-red-500/30";
    default:
      return "bg-slate-500/10 text-slate-300 border-slate-500/30";
  }
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
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Mes documents</h2>
              <p className="text-sm text-slate-400">
                {documents.length} document(s)
              </p>
            </div>

            <button
              onClick={() => refreshDocuments()}
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800"
            >
              Rafraîchir
            </button>
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
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold">
                        {document.title}
                      </h3>
                      <span
                        className={`rounded-full border px-2 py-1 text-xs ${statusClass(
                          document.status
                        )}`}
                      >
                        {document.status}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-slate-400">
                      {document.filename} · {document.file_type} ·{" "}
                      {formatFileSize(document.file_size)}
                    </p>

                    {document.error_message && (
                      <p className="mt-2 text-sm text-red-300">
                        {document.error_message}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleIndex(document.id)}
                      disabled={actionLoadingId === document.id}
                      className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {actionLoadingId === document.id
                        ? "Action..."
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