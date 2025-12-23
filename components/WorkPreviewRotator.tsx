"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

export type WorkPreviewItem = {
  id: string;
  title: string;
  url: string;
  previewImage: string | null;
  previewImages?: string[];
  previewTitle: string | null;
  previewDescription: string | null;
  previewDomain: string | null;
};

export function WorkPreviewRotator(props: {
  items: WorkPreviewItem[];
  intervalMs?: number;
}) {
  const items = useMemo(() => props.items.filter(Boolean), [props.items]);
  const intervalMs = props.intervalMs ?? 2600;
  const [i, setI] = useState(0);

  useEffect(() => {
    if (items.length <= 1) return;
    const t = setInterval(() => setI((v) => (v + 1) % items.length), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs, items.length]);

  const current = items[i] ?? items[0] ?? null;

  const heroImage =
    (current?.previewImages?.length ? current.previewImages[0] : null) ?? current?.previewImage ?? null;

  if (!current) {
    return null;
  }

  return (
    <div className="relative h-full w-full">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={current.id}
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.985, y: -10 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative h-full w-full"
        >
          <div className="relative h-full w-full overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <div className="absolute inset-0">
              <div className="hero-blob hero-blob-1 absolute -left-24 -top-24 h-72 w-72 rounded-full bg-gradient-to-br from-emerald-400/40 to-sky-400/40 blur-2xl" />
              <div className="hero-blob hero-blob-2 absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-gradient-to-br from-fuchsia-400/30 to-amber-300/30 blur-2xl" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.5),transparent_55%)] dark:bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.12),transparent_55%)]" />
            </div>

            {heroImage ? (
              <div className="absolute inset-0">
                <Image
                  src={heroImage}
                  alt={current.title}
                  fill
                  sizes="(max-width: 1024px) 90vw, 420px"
                  className="object-cover opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white/85 via-white/20 to-white/0 dark:from-black/75 dark:via-black/25 dark:to-black/0" />
              </div>
            ) : null}

            <div className="relative flex h-full w-full flex-col justify-end p-6">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0.05 }}
                className="rounded-2xl border border-zinc-200 bg-white/75 p-4 backdrop-blur dark:border-zinc-800 dark:bg-black/35"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500/80" />
                    <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-500/90 dark:text-zinc-400/90">
                      Featured Work
                    </div>
                  </div>
                  <div className="text-xs text-zinc-600 dark:text-zinc-400">{i + 1}/{items.length}</div>
                </div>

                <div className="mt-2 text-sm font-semibold text-zinc-950 dark:text-zinc-50">{current.previewTitle ?? current.title}</div>
                <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                  {current.previewDomain ?? (() => {
                    try {
                      return new URL(current.url).hostname;
                    } catch {
                      return current.url;
                    }
                  })()}
                </div>

                {current.previewDescription ? (
                  <div className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
                    {current.previewDescription}
                  </div>
                ) : null}

                <div className="mt-3">
                  <Link
                    href="/work"
                    className="inline-flex h-10 items-center justify-center rounded-2xl border border-zinc-200 bg-white/60 px-4 text-sm font-semibold text-zinc-800 transition hover:bg-white dark:border-zinc-800 dark:bg-black/30 dark:text-zinc-200 dark:hover:bg-black/40"
                  >
                    View all works
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
