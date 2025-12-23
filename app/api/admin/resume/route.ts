import { requireAdminSession } from "@/lib/adminSession";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { db } from "@/lib/db";
import { siteSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

const SETTINGS_ID = "global";

export async function GET() {
  const session = await requireAdminSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const rows = await db.select().from(siteSettings).where(eq(siteSettings.id, SETTINGS_ID)).limit(1);
    const settings = rows[0] ?? null;

    return Response.json({
      resumeUrl: settings?.resumeUrl ?? null,
      resumeUpdatedAt: settings?.resumeUpdatedAt ?? null,
    });
  } catch (e) {
    const err = e as unknown as { code?: string; message?: string };
    const message = err?.message ?? (e instanceof Error ? e.message : String(e));
    if (err?.code === "42P01" || message.includes('relation "site_settings" does not exist')) {
      return Response.json({ resumeUrl: null, resumeUpdatedAt: null });
    }
    return Response.json({ error: "Failed to load resume settings" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await requireAdminSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  if (!form) return Response.json({ error: "Invalid form" }, { status: 400 });

  const file = form.get("file");
  if (!(file instanceof File)) return Response.json({ error: "Missing file" }, { status: 400 });

  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) return Response.json({ error: "Only PDF allowed" }, { status: 400 });

  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "public-files";
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json(
      { error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" },
      { status: 400 }
    );
  }

  let supabase: Awaited<ReturnType<typeof getSupabaseAdmin>>;
  try {
    supabase = await getSupabaseAdmin();
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return Response.json({ error: message }, { status: 500 });
  }

  const ext = file.name.toLowerCase().endsWith(".pdf") ? "pdf" : "pdf";
  const path = `resume/resume-${Date.now()}.${ext}`;

  const upload = await supabase.storage.from(bucket).upload(path, file, {
    contentType: "application/pdf",
    upsert: true,
  });

  if (upload.error) {
    return Response.json(
      { error: "Upload failed", details: upload.error.message },
      { status: 500 }
    );
  }

  const storageRef = `supabase://${bucket}/${path}`;

  const now = new Date();

  try {
    await db
      .insert(siteSettings)
      .values({ id: SETTINGS_ID, resumeUrl: storageRef, resumeUpdatedAt: now })
      .onConflictDoUpdate({
        target: siteSettings.id,
        set: { resumeUrl: storageRef, resumeUpdatedAt: now },
      });
  } catch (e) {
    const err = e as unknown as { code?: string; message?: string };
    const message = err?.message ?? (e instanceof Error ? e.message : String(e));
    if (err?.code === "42P01" || message.includes('relation "site_settings" does not exist')) {
      return Response.json(
        { error: "DB table site_settings is missing. Run migrations (npm run db:generate && npm run db:migrate)." },
        { status: 500 }
      );
    }
    return Response.json({ error: "Failed to save resume settings" }, { status: 500 });
  }

  return Response.json({ ok: true, resumeUrl: storageRef });
}
