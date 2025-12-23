import { db } from "@/lib/db";
import { siteSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const SETTINGS_ID = "global";

export async function GET(req: Request) {
  let url: string | null = null;

  try {
    const rows = await db.select().from(siteSettings).where(eq(siteSettings.id, SETTINGS_ID)).limit(1);
    url = rows[0]?.resumeUrl ?? null;
  } catch (e) {
    const err = e as unknown as { code?: string; message?: string };
    const message = err?.message ?? (e instanceof Error ? e.message : String(e));
    const isMissingTable = err?.code === "42P01" || message.includes('relation "site_settings" does not exist');
    if (!isMissingTable) {
      throw e;
    }
  }

  if (!url) {
    return NextResponse.redirect(new URL("/contact", req.url));
  }

  if (url.startsWith("supabase://")) {
    const ref = url.slice("supabase://".length);
    const slash = ref.indexOf("/");
    const bucket = slash === -1 ? ref : ref.slice(0, slash);
    const path = slash === -1 ? "" : ref.slice(slash + 1);

    if (!bucket || !path) {
      return NextResponse.redirect(new URL("/contact", req.url));
    }

    const supabase = await getSupabaseAdmin();
    const signed = await supabase.storage.from(bucket).createSignedUrl(path, 60);
    if (signed.error || !signed.data?.signedUrl) {
      return NextResponse.redirect(new URL("/contact", req.url));
    }

    return NextResponse.redirect(signed.data.signedUrl);
  }

  return NextResponse.redirect(url);
}
