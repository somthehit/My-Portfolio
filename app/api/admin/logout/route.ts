import { clearAdminSession } from "@/lib/adminSession";

export async function POST() {
  await clearAdminSession();
  return Response.json({ ok: true });
}
