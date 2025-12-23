import { projects } from "@/db/schema";
import { db } from "@/lib/db";
import { asc, desc, eq } from "drizzle-orm";

export async function GET() {
  const list = await db
    .select()
    .from(projects)
    .where(eq(projects.isVisible, true))
    .orderBy(asc(projects.order), desc(projects.createdAt));

  return Response.json({ projects: list });
}
