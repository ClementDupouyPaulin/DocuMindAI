"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { getAiStatus, getDashboardStats, getMe } from "@/lib/api";
import type { AiStatus, DashboardStats, User } from "@/types/api";

function InfoCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <p className="text-sm text-slate-400">{title}</p>
      <p className="mt-3 text-xl font-bold text-white">{value}</p>
      <p className="mt-2 text-xs leading-5 text-slate-500">{description}</p>
    </div>
  );
}

function StatusBadge({
  active,
  label,
}: {
  active: boolean;
  label: string;
}) {
  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-semibold ${
        active
          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
          : "border-yellow-500/40 bg-yellow-500/10 text-yellow-300"
      }`}
    >
      {label}
    </span>
  );
}

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [aiStatus, setAiStatus] = useState<AiStatus | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadSettings() {
    setError(null);
    setLoading(true);

    try {
      const [currentUser, currentAiStatus, dashboardStats] = await Promise.all([
        getMe(),
        getAiStatus(),
        getDashboardStats(),
      ]);

      setUser(currentUser);
      setAiStatus(currentAiStatus);
      setStats(dashboardStats);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur pendant le chargement des paramètres."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  const isMockMode = aiStatus?.llm_provider === "mock";
  const isOpenAiMode = aiStatus?.llm_provider === "openai";

  return (
    <AppShell>
      <div>
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="text-3xl font-bold">Paramètres</h1>
            <p className="mt-2 text-slate-400">
              Configuration IA, état du système et informations techniques de
              DocuMind AI.
            </p>
          </div>

          <button
            onClick={loadSettings}
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

        {loading && (
          <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-400">
            Chargement des paramètres...
          </div>
        )}

        {!loading && aiStatus && (
          <>
            <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                <div>
                  <h2 className="text-2xl font-bold">Mode IA</h2>
                  <p className="mt-2 text-sm text-slate-400">
                    Configuration active du moteur de génération et des
                    embeddings.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <StatusBadge
                    active={isMockMode}
                    label={
                      isMockMode ? "Mode démo actif" : "Mode démo désactivé"
                    }
                  />

                  <StatusBadge
                    active={Boolean(aiStatus.openai_configured)}
                    label={
                      aiStatus.openai_configured
                        ? "OpenAI configuré"
                        : "OpenAI non configuré"
                    }
                  />
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <InfoCard
                  title="LLM Provider"
                  value={aiStatus.llm_provider}
                  description="Fournisseur utilisé pour générer les réponses du chat et les résumés."
                />

                <InfoCard
                  title="LLM Model"
                  value={aiStatus.llm_model}
                  description="Modèle utilisé pour produire les réponses en langage naturel."
                />

                <InfoCard
                  title="Embedding Provider"
                  value={aiStatus.embedding_provider}
                  description="Fournisseur utilisé pour transformer les chunks en vecteurs."
                />

                <InfoCard
                  title="Embedding Model"
                  value={aiStatus.embedding_model}
                  description="Modèle d’embedding utilisé pour la recherche vectorielle."
                />
              </div>

              <div
                className={`mt-6 rounded-xl border p-4 ${
                  isOpenAiMode
                    ? "border-emerald-500/30 bg-emerald-500/10"
                    : "border-blue-500/30 bg-blue-500/10"
                }`}
              >
                <p
                  className={`text-sm font-semibold ${
                    isOpenAiMode ? "text-emerald-300" : "text-blue-300"
                  }`}
                >
                  {aiStatus.mode_label}
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {aiStatus.message}
                </p>
              </div>
            </section>

            <section className="mt-8 grid gap-4 md:grid-cols-3">
              <InfoCard
                title="Utilisateur connecté"
                value={user?.full_name || user?.email || "Utilisateur"}
                description="Compte actuellement utilisé dans l’application."
              />

              <InfoCard
                title="Documents indexés"
                value={String(stats?.indexed_documents ?? 0)}
                description="Documents disponibles pour le chat RAG."
              />

              <InfoCard
                title="Chunks vectorisés"
                value={String(stats?.total_chunks ?? 0)}
                description="Fragments stockés et recherchables dans Qdrant."
              />
            </section>

            <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-2xl font-bold">Configuration `.env`</h2>
              <p className="mt-2 text-sm text-slate-400">
                Rappel des deux modes possibles pour ton backend.
              </p>

              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-sm font-semibold text-blue-300">
                    Mode démo sans OpenAI
                  </p>

                  <pre className="mt-4 overflow-x-auto rounded-lg bg-black/40 p-4 text-xs leading-6 text-slate-300">
{`LLM_PROVIDER=mock
LLM_MODEL=mock
OPENAI_API_KEY=
EMBEDDING_MODEL=text-embedding-3-small`}
                  </pre>

                  <p className="mt-3 text-xs leading-5 text-slate-500">
                    Idéal pour présenter le projet sans consommer de quota
                    OpenAI.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-sm font-semibold text-emerald-300">
                    Mode OpenAI réel
                  </p>

                  <pre className="mt-4 overflow-x-auto rounded-lg bg-black/40 p-4 text-xs leading-6 text-slate-300">
{`LLM_PROVIDER=openai
LLM_MODEL=gpt-4.1-mini
OPENAI_API_KEY=sk-...
EMBEDDING_MODEL=text-embedding-3-small`}
                  </pre>

                  <p className="mt-3 text-xs leading-5 text-slate-500">
                    À utiliser uniquement avec une clé valide stockée dans ton
                    `.env`, jamais dans Git.
                  </p>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}