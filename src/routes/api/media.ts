import { createFileRoute } from "@tanstack/react-router";
import { fetchChecked, MEDIA_UA, SaveError } from "@/lib/facebook/http.server";

function json(body: unknown, status = 400): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

function safeName(raw: string | null, fallback: string): string {
  const cleaned = (raw ?? "")
    .replace(/[/\\?%*:|"<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
  return cleaned || fallback;
}

async function handle({ request }: { request: Request }): Promise<Response> {
  const query = new URL(request.url).searchParams;
  const src = query.get("src") ?? "";
  const inline = query.get("inline") === "1";
  if (!src) return json({ error: "Missing file." });

  try {
    const headers = new Headers({
      "user-agent": MEDIA_UA,
      accept: "*/*",
    });
    const range = request.headers.get("range");
    if (range && /^bytes=\d*-\d*$/.test(range)) headers.set("range", range);

    const upstream = await fetchChecked(src, "media", { headers, timeoutMs: 20_000 });
    const type = upstream.headers.get("content-type") ?? "";
    const okType = /^(video\/|image\/|application\/octet-stream|application\/mp4)/i.test(type);
    if (!upstream.ok && upstream.status !== 206) {
      await upstream.body?.cancel();
      return json({ error: "Facebook refused that file. The link may have expired — fetch it again." }, 502);
    }
    if (type && !okType) {
      await upstream.body?.cancel();
      return json({ error: "Facebook didn’t return a media file." }, 502);
    }

    const out = new Headers();
    out.set("content-type", type || "application/octet-stream");
    out.set("accept-ranges", upstream.headers.get("accept-ranges") ?? "bytes");
    out.set("cache-control", "private, max-age=120");
    const length = upstream.headers.get("content-length");
    if (length) out.set("content-length", length);
    const contentRange = upstream.headers.get("content-range");
    if (contentRange) out.set("content-range", contentRange);
    if (!inline) {
      const ext = type.includes("png")
        ? "png"
        : type.includes("webp")
          ? "webp"
          : type.includes("gif")
            ? "gif"
            : type.startsWith("image/")
              ? "jpg"
              : "mp4";
      const name = safeName(query.get("name"), `facebook-media.${ext}`);
      out.set("content-disposition", `attachment; filename="${name}"; filename*=UTF-8''${encodeURIComponent(name)}`);
    }

    return new Response(upstream.body, { status: upstream.status, headers: out });
  } catch (error) {
    if (error instanceof SaveError) return json({ error: error.message }, error.status);
    return json({ error: "Couldn’t download that file." }, 502);
  }
}

export const Route = createFileRoute("/api/media")({
  server: { handlers: { GET: handle } },
});
