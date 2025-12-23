"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function AdminLoginInner() {
  const router = useRouter();
  const sp = useSearchParams();

  const nextPath = useMemo(() => {
    const n = sp.get("next");
    if (!n) return "/admin";
    if (!n.startsWith("/")) return "/admin";
    return n;
  }, [sp]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (loading) return;
    setError(null);
    setLoading(true);

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    }).catch(() => null);

    setLoading(false);

    if (!res || !res.ok) {
      setError("Invalid email or password");
      return;
    }

    router.replace(nextPath);
    router.refresh();
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-zinc-50 text-zinc-950 dark:bg-black dark:text-zinc-50">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-emerald-300/30 blur-3xl dark:bg-emerald-500/15" />
        <div className="absolute -bottom-40 right-[-120px] h-[520px] w-[520px] rounded-full bg-fuchsia-300/20 blur-3xl dark:bg-fuchsia-500/10" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-14">
        <div className="grid w-full grid-cols-1 items-center gap-10 lg:grid-cols-2">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/70 px-4 py-2 text-xs font-medium text-zinc-700 backdrop-blur dark:border-zinc-800 dark:bg-black/30 dark:text-zinc-300">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Admin Access
            </div>

            <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
              Welcome back
              <span className="block text-zinc-500 dark:text-zinc-400">Sign in to manage your portfolio.</span>
            </h1>

            <p className="mt-4 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Secure admin panel for projects, resume uploads, and site insights.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-zinc-200 bg-white/70 p-4 backdrop-blur dark:border-zinc-800 dark:bg-black/30">
                <div className="text-sm font-medium">Projects</div>
                <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">Create & manage showcase items</div>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white/70 p-4 backdrop-blur dark:border-zinc-800 dark:bg-black/30">
                <div className="text-sm font-medium">Visitor Logs</div>
                <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">Track traffic and engagement</div>
              </div>
            </div>
          </div>

          <div className="lg:justify-self-end">
            <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white/70 p-6 shadow-[0_30px_80px_-60px_rgba(0,0,0,0.45)] backdrop-blur dark:border-zinc-800 dark:bg-black/30">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <div className="text-lg font-semibold">Admin Login</div>
                  <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Use your configured admin credentials.</div>
                </div>
                <a
                  href="/"
                  className="rounded-full border border-zinc-200 bg-white/60 px-4 py-2 text-xs font-medium text-zinc-700 transition hover:bg-white dark:border-zinc-800 dark:bg-black/30 dark:text-zinc-200 dark:hover:bg-black/40"
                >
                  Back
                </a>
              </div>

              <form onSubmit={onSubmit} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Email</label>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    autoComplete="email"
                    placeholder="admin@email.com"
                    className="h-11 w-full rounded-2xl border border-zinc-200 bg-white/70 px-4 text-sm outline-none ring-1 ring-transparent transition focus:border-emerald-300 focus:ring-emerald-200 dark:border-zinc-800 dark:bg-black/30 dark:focus:border-emerald-900 dark:focus:ring-emerald-900/40"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Password</label>
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="text-xs font-medium text-zinc-600 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Your password"
                    className="h-11 w-full rounded-2xl border border-zinc-200 bg-white/70 px-4 text-sm outline-none ring-1 ring-transparent transition focus:border-emerald-300 focus:ring-emerald-200 dark:border-zinc-800 dark:bg-black/30 dark:focus:border-emerald-900 dark:focus:ring-emerald-900/40"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="group relative mt-2 inline-flex h-11 w-full items-center justify-center rounded-2xl bg-zinc-950 px-5 text-sm font-semibold text-white shadow-[0_12px_40px_-18px_rgba(0,0,0,0.65)] transition hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                >
                  {loading ? "Signing in…" : "Sign in"}
                </button>

                {error ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
                    {error}
                  </div>
                ) : null}
              </form>

              <div className="mt-6 text-xs text-zinc-500 dark:text-zinc-500">
                Tip: set `JWT_SECRET` in your environment. Admin login uses the `users` table.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-black dark:text-zinc-50" />
      }
    >
      <AdminLoginInner />
    </Suspense>
  );
}
