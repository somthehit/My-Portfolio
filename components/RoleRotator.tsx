"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

export function RoleRotator(props: {
  roles?: string[];
  intervalMs?: number;
  className?: string;
}) {
  const roles = useMemo(
    () =>
      (props.roles?.length ? props.roles : [
        "Full Stack Developer",
        "UI/UX Designer",
        "Product-minded Builder",
      ]).filter(Boolean),
    [props.roles]
  );

  const intervalMs = props.intervalMs ?? 2600;
  const [i, setI] = useState(0);

  useEffect(() => {
    if (roles.length <= 1) return;
    const t = setInterval(() => setI((v) => (v + 1) % roles.length), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs, roles.length]);

  const current = roles[i] ?? roles[0] ?? "";

  return (
    <span
      className={`inline-flex items-center ${props.className ?? ""}`}
      style={{ perspective: 900 }}
    >
      <span className="group relative inline-flex items-center">
        <span className="absolute -inset-2 rounded-2xl bg-gradient-to-r from-emerald-400/25 via-sky-400/20 to-fuchsia-400/25 blur-xl" />
        <span className="absolute inset-0 rounded-2xl bg-white/70 ring-1 ring-zinc-200/70 backdrop-blur dark:bg-black/30 dark:ring-zinc-800" />
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={current}
            initial={{ opacity: 0, scale: 0.92, clipPath: "inset(50% 50% 50% 50% round 16px)" }}
            animate={{ opacity: 1, scale: 1, clipPath: "inset(0% 0% 0% 0% round 16px)" }}
            exit={{ opacity: 0, scale: 0.92, clipPath: "inset(50% 50% 50% 50% round 16px)" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative z-10 inline-flex items-center rounded-2xl px-4 py-2 text-zinc-950 shadow-[0_12px_35px_-18px_rgba(16,185,129,0.65)] ring-1 ring-emerald-200/60 transition group-hover:-translate-y-0.5 dark:text-white dark:ring-emerald-500/20"
          >
            <span className="bg-gradient-to-r from-emerald-600 via-sky-600 to-fuchsia-600 bg-clip-text font-semibold tracking-tight text-transparent dark:from-emerald-300 dark:via-sky-300 dark:to-fuchsia-300">
              {current}
            </span>
          </motion.span>
        </AnimatePresence>
      </span>
    </span>
  );
}
