import { requireAdminSession } from "@/lib/adminSession";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { z } from "zod";

const QuerySchema = z.object({
  projectId: z.string().min(1),
});

export async function POST(req: Request) {
  const session = await requireAdminSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const parsedQuery = QuerySchema.safeParse({ projectId: url.searchParams.get("projectId") });
  if (!parsedQuery.success) return Response.json({ error: "Missing projectId" }, { status: 400 });

  const form = await req.formData().catch(() => null);
  if (!form) return Response.json({ error: "Invalid form data" }, { status: 400 });

  const files = form.getAll("files").filter(Boolean) as File[];
  if (!files.length) return Response.json({ error: "No files" }, { status: 400 });

  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "public-files";

  try {
    const supabase = await getSupabaseAdmin();

    const uploadedUrls: string[] = [];

    for (const file of files) {
      const name = (file as File).name || "upload";
      const ext = name.includes(".") ? name.slice(name.lastIndexOf(".")) : "";
      const ts = Date.now();
      const path = `projects/${parsedQuery.data.projectId}/${ts}-${Math.random().toString(16).slice(2)}${ext}`;

      const buf = new Uint8Array(await file.arrayBuffer());
      const upload = await supabase.storage.from(bucket).upload(path, buf, {
        contentType: file.type || "application/octet-stream",
        upsert: true,
      });

      if (upload.error) {
        return Response.json({ error: "Upload failed", details: upload.error.message }, { status: 500 });
      }

      const publicUrl = supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
      uploadedUrls.push(publicUrl);
    }

    return Response.json({ ok: true, urls: uploadedUrls });
  } catch (e) {
    const err = e as unknown as { message?: string };
    return Response.json({ error: "Upload failed", details: err?.message ?? String(e) }, { status: 500 });
  }
}
