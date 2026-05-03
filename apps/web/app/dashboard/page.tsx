"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { getDashboardStats, getMe } from "@/lib/api";
import type { DashboardStats, User } from "@/types/api";

function StatCard({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-bold text-white">{value}</p>
      <p className="mt-2 text-xs text-slate-500">{description}</p>
    </div>
  );
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadDashboard() {
    setError(null);

    try {
      const [currentUser, dashboardStats] = await Promise.all([
        getMe(),
        getDashboardStats(),
      ]);

      setUser(currentUser);
      setStats(dashboardStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur dashboard.");
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  return (
    <AppShell>
      <div>
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="mt-2 text-slate-400">
              Bienvenue {user?.full_name || user?.email || "dans DocuMind AI"}.
            </p>
          </div>

          <button
            onClick={loadDashboard}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
          >
            Rafraîchir
          </button>
        </div>

        {error && (
          <div className="mt-6 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {!stats && !error && (
          <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-400">
            Chargement des statistiques...
          </div>
        )}

        {stats && (
          <>
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Documents"
                value={stats.total_documents}
                description="Documents importés dans ton espace."
              />

              <StatCard
                label="Documents indexés"
                value={stats.indexed_documents}
                description="Documents prêts pour le chat RAG."
              />

              <StatCard
                label="Chunks"
                value={stats.total_chunks}
                description="Fragments stockés et recherchables."
              />

              <StatCard
                label="Conversations"
                value={stats.total_conversations}
                description="Discussions sauvegardées."
              />
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <StatCard
                label="En cours"
                value={stats.processing_documents}
                description="Documents actuellement en indexation."
              />

              <StatCard
                label="En erreur"
                value={stats.failed_documents}
                description="Documents dont l’indexation a échoué."
              />

              <StatCard
                label="Messages"
                value={stats.total_messages}
                description="Messages utilisateur et assistant."
              />
            </div>

            <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-xl font-semibold">État du système RAG</h2>

              <div className="mt-4 space-y-3 text-sm text-slate-400">
                <p>
                  Ton espace contient{" "}
                  <span className="font-semibold text-slate-200">
                    {stats.indexed_documents}
                  </span>{" "}
                  document(s) indexé(s), découpés en{" "}
                  <span className="font-semibold text-slate-200">
                    {stats.total_chunks}
                  </span>{" "}
                  chunk(s).
                </p>

                <p>
                  Les documents indexés sont utilisables dans le chat
                  documentaire avec recherche vectorielle Qdrant et réponses
                  sourcées.
                </p>

                {stats.failed_documents > 0 && (
                  <p className="text-red-300">
                    {stats.failed_documents} document(s) sont en erreur. Va dans
                    la page Documents pour consulter le détail.
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}