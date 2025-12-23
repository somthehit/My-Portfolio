import { ContactForm } from "@/components/ContactForm";

export default function ContactPage() {
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "hello@example.com";

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-16 text-zinc-950 dark:bg-black dark:text-zinc-50">
      <div className="mx-auto w-full max-w-4xl">
        <h1 className="text-4xl font-semibold tracking-tight">Contact</h1>
        <p className="mt-3 max-w-xl text-base leading-7 text-zinc-600 dark:text-zinc-400">
          Reach out anytime.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-6">
          <div>
            <a
              className="inline-flex h-12 items-center justify-center rounded-full border border-emerald-500/70 bg-emerald-500 px-6 text-sm font-semibold text-black shadow-[0_10px_30px_-12px_rgba(16,185,129,0.8)] ring-1 ring-emerald-300/40 transition hover:-translate-y-0.5 hover:bg-emerald-400 active:translate-y-0 dark:border-emerald-400/60 dark:bg-emerald-400 dark:text-black dark:ring-emerald-200/30"
              href={`mailto:${contactEmail}`}
            >
              Hire me
            </a>
          </div>

          <ContactForm />
        </div>
      </div>
    </div>
  );
}
