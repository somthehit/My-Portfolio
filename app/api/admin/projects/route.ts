import { projects } from "@/db/schema";
import { db } from "@/lib/db";
import { fetchMicrolinkPreview } from "@/lib/microlink";
import { requireAdminSession } from "@/lib/adminSession";
import { asc, desc, eq } from "drizzle-orm";
import { z } from "zod";

const CreateSchema = z.object({
  title: z.string().min(1),
  url: z.string().url(),
  description: z.string().optional().nullable(),
  techStack: z.array(z.string()).default([]),
  order: z.number().int().optional(),
  isVisible: z.boolean().optional(),
});

const UpdateSchema = CreateSchema.partial().extend({
  id: z.string().min(1),
  refreshPreview: z.boolean().optional(),
  previewImages: z.array(z.string().url()).optional(),
});

export async function GET() {
  const session = await requireAdminSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const list = await db.select().from(projects).orderBy(asc(projects.order), desc(projects.createdAt));

  return Response.json({ projects: list });
}

export async function POST(req: Request) {
  const session = await requireAdminSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = CreateSchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return Response.json({ error: "Invalid body" }, { status: 400 });

  const preview = await fetchMicrolinkPreview(body.data.url);

  const created = await db
    .insert(projects)
    .values({
      title: body.data.title,
      url: body.data.url,
      description: body.data.description ?? null,
      techStack: body.data.techStack,
      order: body.data.order ?? 0,
      isVisible: body.data.isVisible ?? true,
      previewImage: preview.previewImage,
      previewImages: preview.previewImages,
      previewTitle: preview.previewTitle,
      previewDescription: preview.previewDescription,
      previewDomain: preview.previewDomain,
      previewFetchedAt: new Date(),
    })
    .returning();

  const project = created[0] ?? null;
  if (!project) return Response.json({ error: "Create failed" }, { status: 500 });

  return Response.json({ project });
}

export async function PATCH(req: Request) {
  const session = await requireAdminSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = UpdateSchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return Response.json({ error: "Invalid body" }, { status: 400 });

  const existing = await db
    .select()
    .from(projects)
    .where(eq(projects.id, body.data.id))
    .limit(1);

  const current = existing[0];
  if (!current) return Response.json({ error: "Not found" }, { status: 404 });

  const nextUrl = body.data.url ?? current.url;
  const shouldRefreshPreview =
    body.data.refreshPreview === true || (body.data.url !== undefined && body.data.url !== current.url);

  const preview = shouldRefreshPreview ? await fetchMicrolinkPreview(nextUrl) : null;

  const patch: Partial<typeof projects.$inferInsert> = {};
  if (body.data.title !== undefined) patch.title = body.data.title;
  if (body.data.url !== undefined) patch.url = body.data.url;
  if (body.data.description !== undefined) patch.description = body.data.description;
  if (body.data.techStack !== undefined) patch.techStack = body.data.techStack;
  if (body.data.order !== undefined) patch.order = body.data.order;
  if (body.data.isVisible !== undefined) patch.isVisible = body.data.isVisible;
  if (body.data.previewImages !== undefined) patch.previewImages = body.data.previewImages;

  if (preview) {
    patch.previewImage = preview.previewImage;
    patch.previewImages = preview.previewImages;
    patch.previewTitle = preview.previewTitle;
    patch.previewDescription = preview.previewDescription;
    patch.previewDomain = preview.previewDomain;
    patch.previewFetchedAt = new Date();
  }

  const updated = await db.update(projects).set(patch).where(eq(projects.id, body.data.id)).returning();
  const project = updated[0] ?? null;
  if (!project) return Response.json({ error: "Update failed" }, { status: 500 });

  return Response.json({ project });
}

export async function DELETE(req: Request) {
  const session = await requireAdminSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = z
    .object({ id: z.string().min(1) })
    .safeParse(await req.json().catch(() => null));

  if (!body.success) return Response.json({ error: "Invalid body" }, { status: 400 });

  await db.delete(projects).where(eq(projects.id, body.data.id));
  return Response.json({ ok: true });
}
