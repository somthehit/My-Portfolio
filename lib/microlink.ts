import { z } from "zod";

const MicrolinkResponseSchema = z.object({
  status: z.union([z.string(), z.number()]).optional(),
  data: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
      url: z.string().optional(),
      screenshot: z
        .object({
          url: z.string().url().optional(),
        })
        .optional(),
    })
    .optional(),
});

export type UrlPreview = {
  previewImage: string | null;
  previewImages: string[];
  previewTitle: string | null;
  previewDescription: string | null;
  previewDomain: string | null;
};

export async function fetchMicrolinkPreview(targetUrl: string): Promise<UrlPreview> {
  const base = await fetchMicrolinkOnce(targetUrl).catch(() => null);
  const desktop = await fetchMicrolinkOnce(targetUrl, {
    width: 1280,
    height: 720,
    deviceScaleFactor: 1,
    isMobile: false,
  }).catch(() => null);
  const mobile = await fetchMicrolinkOnce(targetUrl, {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    isMobile: true,
  }).catch(() => null);

  const screenshots = [desktop?.screenshotUrl, mobile?.screenshotUrl].filter(Boolean) as string[];

  return {
    previewImage: screenshots[0] ?? base?.screenshotUrl ?? null,
    previewImages: screenshots,
    previewTitle: base?.title ?? null,
    previewDescription: base?.description ?? null,
    previewDomain: safeDomain(base?.resolvedUrl ?? targetUrl),
  };
}

async function fetchMicrolinkOnce(
  targetUrl: string,
  viewport?: {
    width: number;
    height: number;
    deviceScaleFactor?: number;
    isMobile?: boolean;
  }
): Promise<{
  screenshotUrl: string | null;
  title: string | null;
  description: string | null;
  resolvedUrl: string | null;
}> {
  const params = new URLSearchParams();
  params.set("url", targetUrl);
  params.set("screenshot", "true");
  params.set("meta", "true");

  if (viewport) {
    params.set("viewport.width", String(viewport.width));
    params.set("viewport.height", String(viewport.height));
    if (viewport.deviceScaleFactor !== undefined) {
      params.set("viewport.deviceScaleFactor", String(viewport.deviceScaleFactor));
    }
    if (viewport.isMobile !== undefined) {
      params.set("viewport.isMobile", String(viewport.isMobile));
    }
  }

  const apiUrl = `https://api.microlink.io/?${params.toString()}`;

  const res = await fetch(apiUrl, {
    method: "GET",
    headers: { accept: "application/json" },
    cache: "no-store",
  });

  if (!res.ok) {
    return { screenshotUrl: null, title: null, description: null, resolvedUrl: null };
  }

  const json = MicrolinkResponseSchema.safeParse(await res.json());
  if (!json.success || !json.data.data) {
    return { screenshotUrl: null, title: null, description: null, resolvedUrl: null };
  }

  const data = json.data.data;
  return {
    screenshotUrl: data.screenshot?.url ?? null,
    title: data.title ?? null,
    description: data.description ?? null,
    resolvedUrl: data.url ?? null,
  };
}

function safeDomain(rawUrl: string): string | null {
  try {
    return new URL(rawUrl).hostname;
  } catch {
    return null;
  }
}
