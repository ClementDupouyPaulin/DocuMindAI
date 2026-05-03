import Link from "next/link";

const features = [
  {
    title: "Import documentaire",
    description:
      "Importe des fichiers PDF, TXT et DOCX pour les transformer en base documentaire exploitable.",
  },
  {
    title: "Indexation RAG",
    description:
      "Extraction du texte, découpage en chunks, génération d’embeddings et stockage vectoriel dans Qdrant.",
  },
  {
    title: "Chat sourcé",
    description:
      "Pose des questions sur tes documents et vérifie les sources utilisées pour chaque réponse.",
  },
  {
    title: "Résumé automatique",
    description:
      "Génère, sauvegarde, copie et exporte des synthèses documentaires au format Markdown.",
  },
  {
    title: "Mode démo sans OpenAI",
    description:
      "Teste l’application sans clé OpenAI grâce à un moteur mock utile pour les présentations.",
  },
  {
    title: "Dashboard & paramètres",
    description:
      "Visualise les statistiques RAG, le mode IA actif et l’état technique de l’application.",
  },
];

const stack = [
  "Next.js",
  "React",
  "TypeScript",
  "Tailwind CSS",
  "FastAPI",
  "Python",
  "PostgreSQL",
  "Qdrant",
  "Docker",
  "Alembic",
  "OpenAI-ready",
  "GitHub Actions",
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-xl font-bold">
            DocuMind AI
          </Link>

          <nav className="flex items-center gap-4 text-sm">
            <Link href="/login" className="text-slate-300 hover:text-white">
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

      <section className="mx-auto grid max-w-6xl gap-10 px-6 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <div className="mb-6 inline-flex rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm text-blue-300">
            Assistant documentaire IA · RAG · Portfolio project
          </div>

          <h1 className="text-4xl font-extrabold leading-tight md:text-6xl">
            Transforme tes documents en assistant IA intelligent.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            DocuMind AI permet d’importer des documents, de les indexer dans une
            base vectorielle, puis de poser des questions avec réponses sourcées,
            résumés automatiques et filtres RAG avancés.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
            >
              Essayer DocuMind AI
            </Link>

            <Link
              href="/login"
              className="rounded-xl border border-slate-700 px-5 py-3 font-semibold text-slate-200 hover:bg-slate-900"
            >
              Se connecter
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            {stack.slice(0, 8).map((item) => (
              <span
                key={item}
                className="rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-xs text-slate-300"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-2xl">
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <p className="text-sm text-slate-500">DocuMind AI</p>
                <p className="font-semibold">Chat documentaire</p>
              </div>

              <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
                INDEXED
              </span>
            </div>

            <div className="mt-5 space-y-4">
              <div className="ml-auto max-w-[80%] rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4">
                <p className="text-xs uppercase text-slate-500">Vous</p>
                <p className="mt-2 text-sm">Résume ce document.</p>
              </div>

              <div className="mr-auto rounded-2xl border border-slate-800 bg-slate-900 p-4">
                <p className="text-xs uppercase text-slate-500">DocuMind AI</p>
                <p className="mt-2 text-sm leading-6 text-slate-200">
                  Le document présente les objectifs, le contexte et les points
                  clés du projet. Les informations sont issues des chunks
                  retrouvés dans la base vectorielle.
                </p>

                <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-3">
                  <p className="text-xs font-semibold text-slate-400">
                    Sources utilisées
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    [source_1] Cahier des charges · chunk 0 · score 0.842
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-bold">Fonctionnalités principales</h2>
          <p className="mt-3 text-slate-400">
            Une application full-stack pensée pour démontrer des compétences en
            développement web, backend, IA, data et architecture logicielle.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
            >
              <h3 className="font-semibold text-white">{feature.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8">
          <h2 className="text-3xl font-bold">Stack technique</h2>

          <div className="mt-6 flex flex-wrap gap-2">
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

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="rounded-3xl border border-blue-500/30 bg-blue-500/10 p-8 text-center">
          <h2 className="text-3xl font-bold">
            Un projet IA complet, pensé pour un portfolio.
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-slate-300">
            DocuMind AI montre une maîtrise concrète du full-stack, du RAG, de
            Docker, des bases de données, de l’authentification, des tests et de
            la qualité logicielle.
          </p>

          <div className="mt-8">
            <Link
              href="/register"
              className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
            >
              Lancer l’application
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-800 px-6 py-8 text-center text-sm text-slate-500">
        DocuMind AI — Assistant documentaire IA basé sur une architecture RAG.
      </footer>
    </main>
  );
}