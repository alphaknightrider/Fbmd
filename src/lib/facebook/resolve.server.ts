import { isMediaHost, isPageHost, assertPublicHttp } from "./hosts";
import { fetchChecked, pageHeaders, probeBytes, readHtml, SaveError } from "./http.server";
import { assemble, collectFacebook, directMedia, focusVideos, videoIdFromUrl, type Collected } from "./parse";
import type { ResolveOk } from "./types";

function candidates(input: string): string[] {
  const url = new URL(input);
  const list = [url.toString()];
  if (/facebook\.com$/i.test(url.hostname) && !url.hostname.startsWith("m.")) {
    const mobile = new URL(url.toString());
    mobile.hostname = "m.facebook.com";
    list.push(mobile.toString());
  }
  const id = videoIdFromUrl(url.toString());
  if (id && !url.searchParams.get("v")) {
    list.push(`https://www.facebook.com/watch/?v=${id}`);
    list.push(`https://m.facebook.com/watch/?v=${id}&_rdr`);
  }
  return [...new Set(list)];
}

function score(collected: Collected): number {
  return collected.videos.length * 10 + collected.images.length;
}

async function readPage(url: string): Promise<{ finalUrl: string; html: string }> {
  const response = await fetchChecked(url, "page", { headers: pageHeaders(), timeoutMs: 12_000 });
  if (!response.ok) {
    await response.body?.cancel();
    throw new SaveError("Facebook didn’t return that page.", response.status === 404 ? 404 : 502);
  }
  const html = await readHtml(response);
  return { finalUrl: response.url || url, html };
}

export async function resolveFacebook(raw: string): Promise<ResolveOk> {
  const trimmed = raw.trim();
  if (!trimmed) throw new SaveError("Paste a Facebook link first.");
  let parsed: URL;
  try {
    parsed = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
  } catch {
    throw new SaveError("That doesn’t look like a link.");
  }
  assertPublicHttp(parsed);
  parsed.hash = "";

  if (isMediaHost(parsed.hostname)) {
    const direct = directMedia(parsed.toString());
    if (!direct) throw new SaveError("That Facebook file link isn’t a video or photo.");
    const bytes = await probeBytes(direct.clips[0]?.variants[0]?.url ?? direct.images[0]?.url ?? "");
    if (direct.clips[0]?.variants[0] && bytes) direct.clips[0].variants[0].bytes = bytes;
    return direct;
  }

  if (!isPageHost(parsed.hostname)) {
    throw new SaveError("Paste a public Facebook, fb.watch, or fb.me link.");
  }

  const tries = candidates(parsed.toString()).slice(0, 3);
  let best: { url: string; collected: Collected } | null = null;
  let lastError: SaveError | null = null;

  for (const attempt of tries) {
    try {
      const page = await readPage(attempt);
      const collected = collectFacebook(page.html);
      const current = { url: page.finalUrl || attempt, collected };
      if (!best || score(collected) > score(best.collected)) best = current;
      if (collected.videos.length > 0 || collected.images.length > 0) break;
    } catch (error) {
      lastError = error instanceof SaveError ? error : new SaveError("Facebook didn’t respond.", 502);
    }
  }

  if (!best) throw lastError ?? new SaveError("Facebook didn’t return that page.", 502);

  const { collected } = best;
  if (collected.videos.length === 0 && collected.images.length === 0) {
    const story = /\/stories|story_fbid|story\.php/i.test(parsed.toString());
    throw new SaveError(
      collected.unavailable ??
        (story
          ? "Facebook didn’t include this story on the public page. Stories are usually only visible while signed in, and this saver never takes a password."
          : "No public video or photo was on that page. It may be private, deleted, or only visible when you’re logged in."),
      422,
    );
  }

  const sizes = new Map<string, number | null>();
  const sample = focusVideos(collected.videos, parsed.toString()).slice(0, 4);
  await Promise.all(
    sample.map(async (video) => {
      sizes.set(video.url, await probeBytes(video.url));
    }),
  );

  const result = assemble(collected, parsed.toString(), sizes);
  if (result.clips.length === 0 && result.images.length === 0) {
    throw new SaveError("No downloadable file was attached to that public post.", 422);
  }
  return result;
}
