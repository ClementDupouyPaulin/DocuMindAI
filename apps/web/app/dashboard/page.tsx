"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { getAiStatus, getDashboardStats, getMe } from "@/lib/api";
import type { AiStatus, DashboardStats, User } from "@/types/api";

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

function AiModeCard({ aiStatus }: { aiStatus: AiStatus }) {
  return (
    <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-xl font-semibold">Mode IA</h2>
          <p className="mt-2 text-sm text-slate-400">
            Configuration active du moteur LLM et du moteur d’embeddings.
          </p>
        </div>

        <span
          className={`w-fit rounded-full border px-3 py-1 text-sm font-medium ${
            aiStatus.demo_mode
              ? "border-blue-500/40 bg-blue-500/10 text-blue-300"
              : "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
          }`}
        >
          {aiStatus.demo_mode ? "Mode démo sans OpenAI" : "Mode OpenAI"}
        </span>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
          <p className="text-sm text-slate-500">LLM Provider</p>
          <p className="mt-1 font-semibold text-slate-100">
            {aiStatus.llm_provider}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Modèle : {aiStatus.llm_model}
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
          <p className="text-sm text-slate-500">Embedding Provider</p>
          <p className="mt-1 font-semibold text-slate-100">
            {aiStatus.embedding_provider}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Modèle : {aiStatus.embedding_model}
          </p>
        </div>
      </div>

      {aiStatus.demo_mode && (
        <div className="mt-5 rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
          <p className="text-sm font-medium text-blue-300">
            Mode démonstration actif
          </p>
          <p className="mt-2 text-sm leading-6 text-blue-100/80">
            DocuMind AI utilise des embeddings simulés et une réponse locale
            basée sur les chunks retrouvés. Ce mode permet de tester
            l’application sans clé OpenAI et sans consommation de quota.
          </p>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [aiStatus, setAiStatus] = useState<AiStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadDashboard() {
    setError(null);

    try {
      const [currentUser, dashboardStats, currentAiStatus] = await Promise.all([
        getMe(),
        getDashboardStats(),
        getAiStatus(),
      ]);

      setUser(currentUser);
      setStats(dashboardStats);
      setAiStatus(currentAiStatus);
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

            {aiStatus && <AiModeCard aiStatus={aiStatus} />}

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