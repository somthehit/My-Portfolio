import { requireAdminSession } from "@/lib/adminSession";
import { contactMessages } from "@/db/schema";
import { db } from "@/lib/db";
import { desc } from "drizzle-orm";

export async function GET() {
  const session = await requireAdminSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const messages = await db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt));
    return Response.json({ messages });
  } catch {
    return Response.json({ error: "Failed to load messages" }, { status: 500 });
  }
}
