"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearAccessToken } from "@/lib/auth";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const router = useRouter();

  function logout() {
    clearAccessToken();
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="text-xl font-bold">
            DocuMind AI
          </Link>

          <nav className="flex items-center gap-4 text-sm">
            <Link href="/dashboard" className="text-slate-300 hover:text-white">
              Dashboard
            </Link>
            <Link href="/documents" className="text-slate-300 hover:text-white">
              Documents
            </Link>
            <Link href="/chat" className="text-slate-300 hover:text-white">
              Chat
            </Link>
            <button
              onClick={logout}
              className="rounded-lg bg-red-500 px-3 py-2 text-sm font-medium text-white hover:bg-red-600"
            >
              Déconnexion
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}