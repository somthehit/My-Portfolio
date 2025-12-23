import { z } from "zod";
import { db } from "@/lib/db";
import { projects } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

const BodySchema = z.object({
  projectId: z.string().min(1),
  like: z.boolean().optional(),
  rating: z.number().int().min(1).max(5).optional(),
});

export async function POST(req: Request) {
  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid body" }, { status: 400 });

  const { projectId, like, rating } = parsed.data;

  if (!like && rating === undefined) {
    return Response.json({ error: "Nothing to update" }, { status: 400 });
  }

  const set: Record<string, unknown> = {};

  if (like) {
    set.likesCount = sql`${projects.likesCount} + 1`;
  }

  if (rating !== undefined) {
    set.ratingCount = sql`${projects.ratingCount} + 1`;
    set.ratingSum = sql`${projects.ratingSum} + ${rating}`;
  }

  const updated = await db.update(projects).set(set).where(eq(projects.id, projectId)).returning({
    id: projects.id,
    likesCount: projects.likesCount,
    ratingCount: projects.ratingCount,
    ratingSum: projects.ratingSum,
  });

  const row = updated[0] ?? null;
  if (!row) return Response.json({ error: "Not found" }, { status: 404 });

  const avgRating = row.ratingCount ? row.ratingSum / row.ratingCount : 0;

  return Response.json({
    ok: true,
    project: {
      id: row.id,
      likesCount: row.likesCount,
      ratingCount: row.ratingCount,
      ratingSum: row.ratingSum,
      avgRating,
    },
  });
}
