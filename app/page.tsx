import Image from "next/image";
import Link from "next/link";
import { RoleRotator } from "@/components/RoleRotator";
import { WorkPreviewRotator } from "@/components/WorkPreviewRotator";
import { db } from "@/lib/db";
import { siteSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { projects } from "@/db/schema";
import { asc, desc } from "drizzle-orm";

const SETTINGS_ID = "global";

const FALLBACK_ROLES = ["Full Stack Developer", "UI/UX Designer", "Product-focused Engineer"];

export default async function Home() {
  let roles = FALLBACK_ROLES;
  let featuredWorks: {
    id: string;
    title: string;
    url: string;
    previewImage: string | null;
    previewImages: string[];
    previewTitle: string | null;
    previewDescription: string | null;
    previewDomain: string | null;
  }[] = [];

  try {
    const rows = await db
      .select({ heroRoles: siteSettings.heroRoles })
      .from(siteSettings)
      .where(eq(siteSettings.id, SETTINGS_ID))
      .limit(1);

    const heroRoles = rows[0]?.heroRoles ?? null;
    if (Array.isArray(heroRoles) && heroRoles.filter(Boolean).length) {
      roles = heroRoles.filter(Boolean);
    }
  } catch (e) {
    const err = e as unknown as { code?: string; message?: string };
    const message = err?.message ?? (e instanceof Error ? e.message : String(e));
    const isMissingTable = err?.code === "42P01" || message.includes('relation "site_settings" does not exist');
    const isMissingColumn = err?.code === "42703" || message.includes("hero_roles") || message.includes("does not exist");
    if (!isMissingTable && !isMissingColumn) throw e;
  }

  try {
    featuredWorks = await db
      .select({
        id: projects.id,
        title: projects.title,
        url: projects.url,
        previewImage: projects.previewImage,
        previewImages: projects.previewImages,
        previewTitle: projects.previewTitle,
        previewDescription: projects.previewDescription,
        previewDomain: projects.previewDomain,
      })
      .from(projects)
      .where(eq(projects.isVisible, true))
      .orderBy(asc(projects.order), desc(projects.createdAt))
      .limit(8);
  } catch {
    featuredWorks = [];
  }

  return (
    <div className="relative min-h-screen bg-zinc-50 text-zinc-950 dark:bg-black dark:text-zinc-50">
      <main className="mx-auto grid min-h-screen w-full max-w-6xl grid-cols-1 items-center gap-10 px-6 py-16 sm:px-10 lg:grid-cols-2">
        <section className="flex flex-col gap-6">
          <Link
            href="/contact"
            className="group inline-flex w-fit items-center gap-3 rounded-full border border-transparent bg-white/60 px-3 py-2 text-sm text-zinc-600 shadow-sm ring-1 ring-zinc-200/80 transition hover:bg-white hover:text-zinc-950 hover:ring-zinc-300 dark:bg-black/20 dark:text-zinc-400 dark:ring-zinc-800 dark:hover:bg-black/30 dark:hover:text-zinc-50"
          >
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500">
              <span className="hero-ping absolute inset-0 rounded-full bg-emerald-500/70" />
            </span>
            Available for work
            <span className="ml-1 opacity-70 transition group-hover:translate-x-0.5">→</span>
          </Link>

          <h1 className="text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
            Hi, I’m Som Prakash
          </h1>

          <div className="text-xl leading-8 text-zinc-700 dark:text-zinc-300">
            <RoleRotator
              roles={roles}
              className="font-medium text-zinc-950 dark:text-zinc-50"
            />
          </div>

          <p className="max-w-xl text-base leading-7 text-zinc-600 dark:text-zinc-400">
            I build clean, fast and premium web experiences with strong typography, subtle motion, and production-grade engineering.
          </p>

          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            Design with restraint. Build with integrity.
          </div>

          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/work"
              className="inline-flex h-12 items-center justify-center rounded-full bg-zinc-950 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              View Work <span className="ml-1 text-base opacity-80">→</span>
            </Link>
            <Link
              href="/contact"
              className="inline-flex h-12 items-center justify-center rounded-full border border-zinc-200 bg-white/50 px-6 text-sm font-medium text-zinc-950 transition hover:bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-black/20 dark:text-zinc-50 dark:hover:bg-black/30"
            >
              Contact
            </Link>
            <a
              href="/resume"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-12 items-center justify-center rounded-full border border-emerald-500/70 bg-emerald-500 px-6 text-sm font-semibold text-black shadow-[0_10px_30px_-12px_rgba(16,185,129,0.8)] ring-1 ring-emerald-300/40 transition hover:-translate-y-0.5 hover:bg-emerald-400 active:translate-y-0 dark:border-emerald-400/60 dark:bg-emerald-400 dark:text-black dark:ring-emerald-200/30"
            >
              Resume
            </a>
          </div>
        </section>

        <section className="relative">
          <div className="relative mx-auto aspect-square w-full max-w-md">
            <WorkPreviewRotator items={featuredWorks} intervalMs={2600} />
          </div>

          <div className="mt-6 flex items-center justify-center gap-7 text-sm text-zinc-600 dark:text-zinc-400">
            <a
              href="https://github.com"
              className="underline-offset-4 transition hover:text-zinc-950 hover:underline dark:hover:text-white"
            >
              GitHub
            </a>
            <a
              href="https://linkedin.com"
              className="underline-offset-4 transition hover:text-zinc-950 hover:underline dark:hover:text-white"
            >
              LinkedIn
            </a>
            <a
              href="https://facebook.com"
              className="underline-offset-4 transition hover:text-zinc-950 hover:underline dark:hover:text-white"
            >
              Facebook
            </a>
            <a
              href="/contact"
              className="underline-offset-4 transition hover:text-zinc-950 hover:underline dark:hover:text-white"
            >
              Email
            </a>
          </div>
        </section>
      </main>

    </div>
  );
}
