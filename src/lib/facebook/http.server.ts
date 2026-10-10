import { assertPublicHttp, isMediaHost, isPageHost } from "./hosts";

const PAGE_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

export const MEDIA_UA = "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)";

export class SaveError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
  }
}

function allowHost(hostname: string, kind: "page" | "media"): boolean {
  return kind === "page" ? isPageHost(hostname) : isMediaHost(hostname);
}

export async function fetchChecked(
  start: string,
  kind: "page" | "media",
  init: { headers?: Headers; signal?: AbortSignal; timeoutMs?: number },
): Promise<Response> {
  let current = new URL(start);
  assertPublicHttp(current);
  if (!allowHost(current.hostname, kind)) {
    throw new SaveError(
      kind === "page"
        ? "Paste a public Facebook, fb.watch, or fb.me link."
        : "That file isn’t hosted on Facebook’s media network.",
    );
  }

  const timeoutMs = init.timeoutMs ?? 12_000;
  for (let hop = 0; hop < 5; hop += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const onAbort = () => controller.abort();
    init.signal?.addEventListener("abort", onAbort);
    try {
      const response = await fetch(current, {
        headers: init.headers,
        redirect: "manual",
        signal: controller.signal,
      });
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        await response.body?.cancel();
        if (!location) throw new SaveError("Facebook redirected without a destination.", 502);
        const next = new URL(location, current);
        assertPublicHttp(next);
        if (!allowHost(next.hostname, kind)) {
          throw new SaveError("Facebook sent that link somewhere this saver won’t follow.", 502);
        }
        current = next;
        continue;
      }
      return response;
    } catch (error) {
      if (error instanceof SaveError) throw error;
      if (error instanceof Error && error.name === "AbortError") {
        throw new SaveError("Facebook took too long to answer. Try the link again.", 504);
      }
      throw new SaveError("Facebook didn’t respond. Try the link again.", 502);
    } finally {
      clearTimeout(timer);
      init.signal?.removeEventListener("abort", onAbort);
    }
  }
  throw new SaveError("That link redirected too many times.", 502);
}

export function pageHeaders(): Headers {
  return new Headers({
    "user-agent": PAGE_UA,
    accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "accept-language": "en-US,en;q=0.9",
    "sec-fetch-dest": "document",
    "sec-fetch-mode": "navigate",
    "sec-fetch-site": "none",
    "upgrade-insecure-requests": "1",
  });
}

export async function readHtml(response: Response, maxBytes = 4_000_000): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (total < maxBytes) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    chunks.push(value);
  }
  await reader.cancel();
  const buffer = new Uint8Array(Math.min(total, maxBytes));
  let offset = 0;
  for (const chunk of chunks) {
    const slice = chunk.subarray(0, buffer.length - offset);
    buffer.set(slice, offset);
    offset += slice.byteLength;
    if (offset >= buffer.length) break;
  }
  return new TextDecoder().decode(buffer);
}

export async function probeBytes(url: string): Promise<number | null> {
  try {
    const response = await fetchChecked(url, "media", {
      headers: new Headers({
        "user-agent": MEDIA_UA,
        range: "bytes=0-0",
        accept: "*/*",
      }),
      timeoutMs: 8_000,
    });
    const range = response.headers.get("content-range");
    await response.body?.cancel();
    const total = range?.match(/\/(\d+)\s*$/)?.[1];
    if (total) return Number(total);
    const length = response.headers.get("content-length");
    if (length && response.status === 200) return Number(length);
    return null;
  } catch {
    return null;
  }
}
