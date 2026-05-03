import Link from "next/link";

const features = [
  {
    title: "Import documentaire",
    description:
      "Import de documents PDF, DOCX et TXT avec stockage des métadonnées en PostgreSQL.",
  },
  {
    title: "Pipeline RAG",
    description:
      "Extraction, nettoyage, chunking, embeddings, stockage Qdrant et réponses augmentées par les sources.",
  },
  {
    title: "Réponses sourcées",
    description:
      "Chaque réponse du chat affiche les extraits utilisés, le document, le chunk et le score de similarité.",
  },
  {
    title: "Dashboard analytique",
    description:
      "Suivi des documents, chunks, conversations, messages et erreurs d’indexation.",
  },
];

const stack = [
  "Next.js",
  "TypeScript",
  "Tailwind CSS",
  "FastAPI",
  "Python",
  "PostgreSQL",
  "Qdrant",
  "OpenAI API",
  "Docker",
  "GitHub Actions",
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-xl font-bold">
            DocuMind AI
          </Link>

          <nav className="flex items-center gap-3 text-sm">
            <Link
              href="/login"
              className="rounded-lg border border-slate-700 px-4 py-2 text-slate-200 hover:bg-slate-800"
            >
              Connexion
            </Link>

            <Link
              href="/register"
              className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
            >
              Créer un compte
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <div className="inline-flex rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-sm text-blue-300">
            Plateforme RAG full-stack
          </div>

          <h1 className="mt-6 max-w-3xl text-5xl font-bold tracking-tight text-white md:text-6xl">
            Interroge tes documents avec une IA sourcée.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-400">
            DocuMind AI permet d’importer des documents PDF, DOCX ou TXT, de les
            indexer dans une base vectorielle, puis de poser des questions en
            langage naturel avec des réponses basées sur les sources retrouvées.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="rounded-xl bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700"
            >
              Tester l’application
            </Link>

            <Link
              href="/login"
              className="rounded-xl border border-slate-700 px-5 py-3 font-medium text-slate-200 hover:bg-slate-800"
            >
              Se connecter
            </Link>
          </div>

          <p className="mt-4 text-sm text-slate-500">
            Projet portfolio orienté IA, data, backend, architecture et DevOps.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-2xl">
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <p className="text-sm text-slate-500">Chat documentaire</p>
                <p className="mt-1 font-semibold text-white">
                  Analyse de documents
                </p>
              </div>

              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
                INDEXED
              </span>
            </div>

            <div className="mt-5 space-y-4">
              <div className="ml-auto max-w-[85%] rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Vous
                </p>
                <p className="mt-2 text-sm">
                  Résume les points importants du document.
                </p>
              </div>

              <div className="max-w-[92%] rounded-2xl border border-slate-700 bg-slate-900 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  DocuMind AI
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-200">
                  Le document présente les éléments principaux, les définitions
                  clés et les obligations mentionnées. La réponse est construite
                  uniquement à partir des extraits retrouvés.
                </p>

                <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-3">
                  <p className="text-xs font-semibold text-slate-400">
                    Source utilisée
                  </p>
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    document.pdf · chunk 4 · score 0.842
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
            >
              <h2 className="font-semibold text-white">{feature.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-800 bg-slate-900/40">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <h2 className="text-2xl font-bold">Stack technique</h2>
          <p className="mt-2 text-slate-400">
            Une stack moderne pensée pour démontrer des compétences full-stack,
            IA, backend, data et DevOps.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            {stack.map((item) => (
              <span
                key={item}
                className="rounded-full border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-300"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 md:p-10">
          <div className="grid gap-8 md:grid-cols-[1fr_0.8fr] md:items-center">
            <div>
              <h2 className="text-3xl font-bold">
                Un projet conçu pour aller au-delà d’un simple chatbot.
              </h2>

              <p className="mt-4 leading-7 text-slate-400">
                DocuMind AI couvre toute la chaîne d’une application IA moderne :
                ingestion documentaire, extraction, découpage, embeddings,
                recherche vectorielle, génération augmentée, citations,
                historique, dashboard, tests, Docker et CI GitHub Actions.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
              <p className="text-sm font-semibold text-slate-300">
                Ce que le projet démontre
              </p>

              <ul className="mt-4 space-y-3 text-sm text-slate-400">
                <li>• Architecture backend FastAPI modulaire</li>
                <li>• Recherche vectorielle avec Qdrant</li>
                <li>• Authentification JWT</li>
                <li>• PostgreSQL + migrations Alembic</li>
                <li>• Tests backend + CI GitHub Actions</li>
                <li>• Interface produit en Next.js</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-800 px-6 py-8 text-center text-sm text-slate-500">
        DocuMind AI — Projet portfolio full-stack IA/RAG.
      </footer>
    </main>
  );
}