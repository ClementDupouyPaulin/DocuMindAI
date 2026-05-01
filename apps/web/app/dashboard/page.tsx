"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getMe, listDocuments, listConversations } from "@/lib/api";
import { AppShell } from "@/components/AppShell";
import type { Conversation, DocumentItem, User } from "@/types/api";

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [me, docs, convs] = await Promise.all([
          getMe(),
          listDocuments(),
          listConversations(),
        ]);

        setUser(me);
        setDocuments(docs);
        setConversations(convs);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur dashboard.");
      }
    }

    loadDashboard();
  }, []);

  return (
    <AppShell>
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-2 text-slate-400">
          Bienvenue {user?.full_name ?? user?.email ?? "sur DocuMind AI"}.
        </p>

        {error && (
          <div className="mt-6 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">Documents</p>
            <p className="mt-2 text-3xl font-bold">{documents.length}</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">Conversations</p>
            <p className="mt-2 text-3xl font-bold">{conversations.length}</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">Documents indexés</p>
            <p className="mt-2 text-3xl font-bold">
              {documents.filter((doc) => doc.status === "INDEXED").length}
            </p>
          </div>
        </div>

        <div className="mt-8 flex gap-4">
          <Link
            href="/documents"
            className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
          >
            Gérer les documents
          </Link>

          <Link
            href="/chat"
            className="rounded-lg border border-slate-700 px-4 py-2 font-medium text-slate-100 hover:bg-slate-800"
          >
            Ouvrir le chat
          </Link>
        </div>
      </div>
    </AppShell>
  );
}