import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { SaveError } from "@/lib/facebook/http.server";
import { resolveFacebook } from "@/lib/facebook/resolve.server";

const bodySchema = z.object({
  url: z.string().min(1).max(4000),
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

async function handle({ request }: { request: Request }): Promise<Response> {
  try {
    let url = "";
    if (request.method === "GET") {
      url = new URL(request.url).searchParams.get("url") ?? "";
    } else {
      const parsed = bodySchema.safeParse(await request.json().catch(() => null));
      if (!parsed.success) return json({ error: "Paste a Facebook link first." }, 400);
      url = parsed.data.url;
    }
    const result = await resolveFacebook(url);
    return json(result);
  } catch (error) {
    if (error instanceof SaveError) return json({ error: error.message }, error.status);
    console.error("[resolve]", error instanceof Error ? error.name : "error");
    return json({ error: "Couldn’t read that link." }, 500);
  }
}

export const Route = createFileRoute("/api/resolve")({
  server: { handlers: { GET: handle, POST: handle } },
});
