import Image from "next/image";
import { ProjectEngagement } from "@/components/ProjectEngagement";
import { projects } from "@/db/schema";
import { db } from "@/lib/db";
import { asc, desc, eq, sql } from "drizzle-orm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Som Prakash - Work",
  description: "Work page",
};

type Project = {
  id: string;
  title: string;
  url: string;
  description: string | null;
  techStack: string[];
  previewImage: string | null;
  previewImages: string[];
  previewTitle: string | null;
  previewDescription: string | null;
  previewDomain: string | null;
  likesCount: number;
  ratingCount: number;
  ratingSum: number;
};

async function getProjects(): Promise<Project[]> {
  try {
    return await db
      .select()
      .from(projects)
      .where(eq(projects.isVisible, true))
      .orderBy(asc(projects.order), desc(projects.createdAt));
  } catch (e) {
    const err = e as unknown as { code?: string; message?: string };
    const message = err?.message ?? (e instanceof Error ? e.message : String(e));
    const isMissingColumn = err?.code === "42703" || message.includes("does not exist") || message.includes("column");
    if (!isMissingColumn) throw e;

    const rows = await db.execute(sql`
      select
        id,
        title,
        url,
        description,
        tech_stack,
        "order",
        is_visible,
        preview_image,
        preview_title,
        preview_description,
        preview_domain
      from projects
      where is_visible = true
      order by "order" asc, created_at desc
    `);

    const mapped = (rows as unknown as { rows?: any[] } | any[]) as any;
    const list = Array.isArray(mapped) ? mapped : (mapped?.rows ?? []);

    return (list ?? []).map((r: any) => ({
      id: String(r.id),
      title: String(r.title ?? ""),
      url: String(r.url ?? ""),
      description: r.description ?? null,
      techStack: Array.isArray(r.tech_stack) ? r.tech_stack : [],
      previewImage: r.preview_image ?? null,
      previewImages: [],
      previewTitle: r.preview_title ?? null,
      previewDescription: r.preview_description ?? null,
      previewDomain: r.preview_domain ?? null,
      likesCount: 0,
      ratingCount: 0,
      ratingSum: 0,
    }));
  }
}

function safeHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export default async function WorkPage() {
  const projects = await getProjects();

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-16 text-zinc-950 dark:bg-black dark:text-zinc-50">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-10">
          <h1 className="text-4xl font-semibold tracking-tight">Work</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-600 dark:text-zinc-400">
            Case studies with live previews.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-2">
          {projects.map((p) => (
            <article
              key={p.id}
              className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-900">
                {(p.previewImages?.[0] ?? p.previewImage) ? (
                  <Image
                    src={(p.previewImages?.[0] ?? p.previewImage) as string}
                    alt={p.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 600px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm text-zinc-500 dark:text-zinc-400">
                    No preview available
                  </div>
                )}

                {p.previewImages?.[1] ? (
                  <div className="absolute bottom-3 left-3 hidden w-[92px] overflow-hidden rounded-xl border border-zinc-200 bg-white/80 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-black/30 sm:block">
                    <div className="relative aspect-[9/16] w-full">
                      <Image
                        src={p.previewImages[1]}
                        alt={`${p.title} mobile screenshot`}
                        fill
                        className="object-cover"
                        sizes="92px"
                      />
                    </div>
                  </div>
                ) : null}

                <a
                  href={p.url}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute inset-0 flex items-end justify-end p-4 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <span className="rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-white backdrop-blur">
                    View Live
                  </span>
                </a>
              </div>

              <div className="p-4">
                <div className="flex flex-col gap-1">
                  <h2 className="text-lg font-semibold tracking-tight">{p.title}</h2>
                  <div className="text-xs text-zinc-600 dark:text-zinc-400">
                    {(p.previewDomain ?? safeHostname(p.url)) + " ↗"}
                  </div>
                </div>

                {p.description ? (
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-zinc-700 dark:text-zinc-300">{p.description}</p>
                ) : null}

                {p.techStack.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {p.techStack.map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-zinc-200 px-2.5 py-1 text-[11px] text-zinc-700 dark:border-zinc-800 dark:text-zinc-300"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                ) : null}

                <ProjectEngagement
                  projectId={p.id}
                  initialLikes={p.likesCount}
                  initialRatingCount={p.ratingCount}
                  initialRatingSum={p.ratingSum}
                />
              </div>
            </article>
          ))}

          {!projects.length ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
              No projects yet. Add some in /admin.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
