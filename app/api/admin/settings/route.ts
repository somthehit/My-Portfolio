import { requireAdminSession } from "@/lib/adminSession";
import { db } from "@/lib/db";
import { siteSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const SETTINGS_ID = "global";

const UpdateSchema = z.object({
  heroRoles: z.array(z.string().trim().min(1).max(80)).max(20).optional(),
});

export async function GET() {
  const session = await requireAdminSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const rows = await db.select().from(siteSettings).where(eq(siteSettings.id, SETTINGS_ID)).limit(1);
    const settings = rows[0] ?? null;

    return Response.json({
      heroRoles: settings?.heroRoles ?? [],
    });
  } catch (e) {
    const err = e as unknown as { code?: string; message?: string };
    const message = err?.message ?? (e instanceof Error ? e.message : String(e));
    if (err?.code === "42P01" || message.includes('relation "site_settings" does not exist')) {
      return Response.json({ heroRoles: [] });
    }

    return Response.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await requireAdminSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = UpdateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid body" }, { status: 400 });

  const heroRoles = parsed.data.heroRoles?.filter(Boolean);

  try {
    await db
      .insert(siteSettings)
      .values({
        id: SETTINGS_ID,
        heroRoles: heroRoles ?? [],
      })
      .onConflictDoUpdate({
        target: siteSettings.id,
        set: {
          heroRoles: heroRoles ?? [],
        },
      });

    return Response.json({ ok: true });
  } catch (e) {
    const err = e as unknown as { code?: string; message?: string };
    const message = err?.message ?? (e instanceof Error ? e.message : String(e));
    if (err?.code === "42703" || message.includes("hero_roles") || message.includes("does not exist")) {
      return Response.json(
        { error: "DB column hero_roles is missing. Run migrations (npm run db:migrate)." },
        { status: 500 }
      );
    }

    return Response.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
