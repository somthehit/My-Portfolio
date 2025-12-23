import { visitorLogs } from "@/db/schema";
import { requireAdminSession } from "@/lib/adminSession";
import { db } from "@/lib/db";
import { desc, ilike, or } from "drizzle-orm";

export async function GET(req: Request) {
  const session = await requireAdminSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const qRaw = searchParams.get("q")?.trim() ?? "";

  const where = qRaw
    ? or(
        ilike(visitorLogs.path, `%${qRaw}%`),
        ilike(visitorLogs.referrer, `%${qRaw}%`),
        ilike(visitorLogs.ip, `%${qRaw}%`)
      )
    : undefined;

  try {
    const logs = await db
      .select()
      .from(visitorLogs)
      .where(where)
      .orderBy(desc(visitorLogs.createdAt))
      .limit(100);

    return Response.json({ logs });
  } catch (e) {
    const err = e as unknown as { code?: string; message?: string };
    const message = err?.message ?? (e instanceof Error ? e.message : String(e));
    if (err?.code === "42P01" || message.includes('relation "visitor_logs" does not exist')) {
      return Response.json({ logs: [] });
    }
    return Response.json({ error: "Failed to load visitor logs" }, { status: 500 });
  }
}
