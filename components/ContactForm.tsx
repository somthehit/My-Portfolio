"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function submit() {
    setStatus("sending");

    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: name.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        message,
      }),
    });

    if (!res.ok) {
      setStatus("error");
      return;
    }

    setName("");
    setEmail("");
    setPhone("");
    setMessage("");
    setStatus("sent");

    setTimeout(() => {
      setStatus((s) => (s === "sent" ? "idle" : s));
    }, 2600);
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-emerald-200/70 bg-white p-6 shadow-sm dark:border-emerald-900/60 dark:bg-zinc-950">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-emerald-400/20 blur-2xl" />
        <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-sky-400/15 blur-2xl" />
      </div>

      <div className="relative">
        <div className="text-sm font-semibold">Send a message</div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name (Required)"
            className="h-11 rounded-2xl border border-zinc-200 bg-white/70 px-4 text-sm outline-none ring-1 ring-transparent transition focus:border-emerald-300 focus:ring-emerald-200 dark:border-zinc-800 dark:bg-black/30 dark:focus:border-emerald-900 dark:focus:ring-emerald-900/40"
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email (Required)"
            className="h-11 rounded-2xl border border-zinc-200 bg-white/70 px-4 text-sm outline-none ring-1 ring-transparent transition focus:border-emerald-300 focus:ring-emerald-200 dark:border-zinc-800 dark:bg-black/30 dark:focus:border-emerald-900 dark:focus:ring-emerald-900/40"
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone (Required)"
            className="h-11 rounded-2xl border border-zinc-200 bg-white/70 px-4 text-sm outline-none ring-1 ring-transparent transition focus:border-emerald-300 focus:ring-emerald-200 dark:border-zinc-800 dark:bg-black/30 dark:focus:border-emerald-900 dark:focus:ring-emerald-900/40"
          />
          <div className="hidden sm:block" />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Message (min 10 characters)"
            className="min-h-36 resize-none rounded-2xl border border-zinc-200 bg-white/70 px-4 py-3 text-sm outline-none ring-1 ring-transparent transition focus:border-emerald-300 focus:ring-emerald-200 dark:border-zinc-800 dark:bg-black/30 dark:focus:border-emerald-900 dark:focus:ring-emerald-900/40 sm:col-span-2"
          />
        </div>

        <div className="mt-5 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={submit}
            disabled={status === "sending" || message.trim().length < 10}
            className="inline-flex h-12 items-center justify-center rounded-full border border-emerald-500/70 bg-emerald-500 px-6 text-sm font-semibold text-black shadow-[0_10px_30px_-12px_rgba(16,185,129,0.8)] ring-1 ring-emerald-300/40 transition hover:-translate-y-0.5 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60 active:translate-y-0 dark:border-emerald-400/60 dark:bg-emerald-400 dark:text-black dark:ring-emerald-200/30"
          >
            {status === "sending" ? "Sending…" : "Send"}
          </button>

          <AnimatePresence mode="popLayout" initial={false}>
            {status === "sent" ? (
              <motion.div
                key="sent"
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
              >
                Successfully sent
              </motion.div>
            ) : null}

            {status === "error" ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="rounded-full border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
              >
                Failed. Try again.
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
