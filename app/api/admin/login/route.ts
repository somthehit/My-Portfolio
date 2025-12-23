import { z } from "zod";
import { createAdminSession, verifyAdminCredentials } from "@/lib/adminSession";

const BodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  const body = BodySchema.safeParse(await req.json().catch(() => null));
  if (!body.success) {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  const ok = await verifyAdminCredentials(body.data.email, body.data.password);
  if (!ok) {
    return Response.json({ error: "Invalid credentials" }, { status: 401 });
  }

  await createAdminSession(body.data.email);
  return Response.json({ ok: true });
}
