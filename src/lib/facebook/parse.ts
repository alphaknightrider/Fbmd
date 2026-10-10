import { isMediaHost } from "./hosts";
import type { Clip, ImageItem, MediaKind, ResolveOk, Variant } from "./types";

export type RawVideo = {
  url: string;
  height: number | null;
  bitrate: number | null;
  durationS: number | null;
  ownerId: string | null;
  index: number;
};

export type RawImage = {
  url: string;
  width: number | null;
  height: number | null;
  trusted: boolean;
};

export type Collected = {
  videos: RawVideo[];
  images: RawImage[];
  title: string;
  author: string | null;
  durationMs: number | null;
  unavailable: string | null;
};

const VIDEO_KEYS: { key: string; hint: number | null }[] = [
  { key: "browser_native_hd_url", hint: null },
  { key: "browser_native_sd_url", hint: null },
  { key: "playable_url_quality_hd", hint: 720 },
  { key: "playable_url", hint: 360 },
  { key: "progressive_url", hint: null },
  { key: "video_hd_url", hint: 720 },
  { key: "video_sd_url", hint: 360 },
  { key: "watermarked_video_hd_url", hint: 720 },
  { key: "watermarked_video_sd_url", hint: 360 },
  { key: "hd_src", hint: 720 },
  { key: "sd_src", hint: 360 },
];

const LADDER = [240, 270, 360, 480, 540, 576, 640, 720, 960, 1080, 1440, 2160];

export function snapHeight(height: number): number {
  let best = height;
  let bestDist = 25;
  for (const step of LADDER) {
    const dist = Math.abs(step - height);
    if (dist < bestDist) {
      bestDist = dist;
      best = step;
    }
  }
  return bestDist <= 24 ? best : height;
}

function unescapeHtml(value: string): string {
  const named: [string, string][] = [
    ["amp", "&"],
    ["quot", '"'],
    ["apos", "'"],
    ["lt", "<"],
    ["gt", ">"],
    ["nbsp", " "],
  ];
  let out = value;
  for (let pass = 0; pass < 4; pass += 1) {
    let next = out;
    for (const [name, char] of named) next = next.split("&" + name + ";").join(char);
    next = next
      .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => fromPoint(Number.parseInt(hex, 16)))
      .replace(/&#(\d+);/g, (_, num: string) => fromPoint(Number.parseInt(num, 10)));
    if (next === out) break;
    out = next;
  }
  return out;
}

function decodeEntities(value: string): string {
  return unescapeHtml(value);
}

function fromPoint(code: number): string {
  if (!Number.isFinite(code) || code < 0 || code > 0x10ffff) return "";
  try {
    return String.fromCodePoint(code);
  } catch {
    return "";
  }
}

export function preprocess(html: string): string {
  let prepared = html
    .replace(/\\u0022/gi, '"')
    .replace(/\\u0025/gi, "%")
    .replace(/\\u0026/gi, "&")
    .replace(/\\u003a/gi, ":")
    .replace(/\\u002f/gi, "/")
    .replace(/\\u003d/gi, "=")
    .replace(/\\u003f/gi, "?")
    .replace(/\\\//g, "/");
  return unescapeHtml(prepared);
}

function metaContent(html: string, key: string): string | null {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${key}["'][^>]*content=["']([^"']*)["']|<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${key}["']`,
    "i",
  );
  const match = html.match(re);
  const value = match?.[1] || match?.[2];
  if (!value) return null;
  return decodeEntities(value).replace(/\s+/g, " ").trim() || null;
}

function splitTitle(raw: string): { title: string; author: string | null } {
  const parts = raw
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length < 2) return { title: raw, author: null };
  const author = parts[parts.length - 1] ?? null;
  const body = parts.slice(0, -1).map((part) =>
    part
      .replace(
        /^[\d.,]+[KMB]?\s+views\s*(?:·|•)\s*[\d.,]+[KMB]?\s+reactions\s*/i,
        "",
      )
      .trim(),
  );
  const title = body.filter(Boolean).join(" · ") || raw;
  return { title, author };
}

function pathOf(url: string): string | null {
  try {
    return new URL(url).pathname;
  } catch {
    return null;
  }
}

function hostOk(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && isMediaHost(parsed.hostname);
  } catch {
    return false;
  }
}

function decodeB64(value: string): string | null {
  try {
    const pad = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (value.length % 4)) % 4);
    const bytes = Uint8Array.from(atob(pad), (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

function qualityFromUrl(url: string, hint: number | null): Pick<RawVideo, "height" | "bitrate" | "durationS"> {
  let height = hint;
  let bitrate: number | null = null;
  let durationS: number | null = null;
  try {
    const parsed = new URL(url);
    const rawBitrate = parsed.searchParams.get("bitrate");
    if (rawBitrate && Number.isFinite(Number(rawBitrate))) bitrate = Number(rawBitrate);
    const efg = parsed.searchParams.get("efg");
    if (efg) {
      const json = decodeB64(efg);
      if (json) {
        const meta = JSON.parse(json) as { vencode_tag?: string; duration_s?: number };
        const tag = String(meta.vencode_tag ?? "");
        const heightMatch = tag.match(/\.(\d{3,4})\./);
        if (heightMatch) height = Number(heightMatch[1]);
        if (typeof meta.duration_s === "number") durationS = meta.duration_s;
      }
    }
  } catch {
    // Keep the hint when the URL isn't fully parseable.
  }
  return { height, bitrate, durationS };
}

function listVideoIds(html: string): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const match of html.matchAll(/"video_id"\s*:\s*"?(\d{8,})/g)) {
    const id = match[1];
    if (!id || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
}

function nearestOwner(html: string, index: number, ids: string[]): string | null {
  const window = html.slice(Math.max(0, index - 8000), index);
  let best: string | null = null;
  let bestAt = -1;
  for (const id of ids) {
    const at = window.lastIndexOf(id);
    if (at > bestAt) {
      bestAt = at;
      best = id;
    }
  }
  return best;
}

function collectVideos(html: string): RawVideo[] {
  const ids = listVideoIds(html);
  const videos: RawVideo[] = [];
  const seen = new Set<string>();
  for (const { key, hint } of VIDEO_KEYS) {
    const re = new RegExp(`"${key}"\\s*:\\s*"(https://[^"\\s]+)"`, "g");
    for (const match of html.matchAll(re)) {
      const raw = match[1];
      if (!raw) continue;
      const url = unescapeHtml(raw);
      if (!hostOk(url) || !/\.(?:mp4|mov|webm)(?:$|\?)/i.test(url)) continue;
      const path = pathOf(url);
      if (!path || seen.has(path)) continue;
      seen.add(path);
      const index = match.index ?? 0;
      videos.push({
        url,
        index,
        ownerId: nearestOwner(html, index, ids),
        ...qualityFromUrl(url, hint),
      });
    }
  }
  return videos;
}

function readDims(url: string): { width: number; height: number } | null {
  const match = url.match(/(?:dst-(?:jpg|png|webp)_)?(?:^|[^\d])(?:s|p)(\d{2,5})x(\d{2,5})/i);
  if (!match) return null;
  return { width: Number(match[1]), height: Number(match[2]) };
}

function usefulImage(url: string, trusted: boolean): boolean {
  if (!hostOk(url)) return false;
  if (/emoji|static\.xx\.fbcdn\.net|rsrc\.php|safe_image\.php/i.test(url)) return false;
  const looksLikeImage =
    /\.(?:jpe?g|png|webp|gif)(?:$|\?)/i.test(url) || /stp=dst-(?:jpg|png|webp)/i.test(url);
  if (!looksLikeImage) return false;
  const dims = readDims(url);
  if (dims && (dims.width < 320 || dims.height < 320)) return false;
  if (!dims && !trusted && /(?:s|p)\d{2,3}x\d{2,3}/i.test(url)) return false;
  return true;
}

function extOf(url: string, fallback: string): string {
  const path = pathOf(url) ?? "";
  const match = path.match(/\.(mp4|mov|webm|gif|png|webp|jpe?g)$/i);
  if (!match) return fallback;
  const ext = match[1].toLowerCase();
  return ext === "jpeg" ? "jpg" : ext;
}

function collectImages(html: string): RawImage[] {
  const images: RawImage[] = [];
  const seen = new Set<string>();
  const push = (raw: string | null, trusted: boolean) => {
    if (!raw) return;
    const url = unescapeHtml(raw);
    if (!usefulImage(url, trusted)) return;
    const path = pathOf(url);
    if (!path || seen.has(path)) return;
    seen.add(path);
    const dims = readDims(url);
    images.push({
      url,
      width: dims?.width ?? null,
      height: dims?.height ?? null,
      trusted,
    });
  };

  push(metaContent(html, "og:image"), true);
  push(metaContent(html, "twitter:image"), true);

  const re = /"(?:uri|url)"\s*:\s*"(https:\/\/[^"\s]+)"/g;
  for (const match of html.matchAll(re)) {
    push(match[1] ?? null, false);
    if (images.length >= 24) break;
  }
  return images;
}

export function collectFacebook(html: string): Collected {
  const prepared = preprocess(html);
  const rawTitle = metaContent(prepared, "og:title") ?? metaContent(html, "og:title");
  const split = splitTitle(rawTitle ?? "Facebook media");
  const durationMatch = prepared.match(/"playable_duration_in_ms"\s*:\s*(\d+)/);
  const unavailable =
    /content isn't available|content is not available|this content isn't available/i.test(prepared) &&
    !prepared.includes("browser_native_hd_url") &&
    !prepared.includes("browser_native_sd_url")
      ? "Facebook says this content isn’t available. It may be private, deleted, or limited to certain viewers."
      : /you must log in to continue|id="login_form"|id="loginbutton"/i.test(prepared)
        ? "Facebook is asking for a login. This saver only keeps media the public page already includes — it never asks for your password."
        : null;

  return {
    videos: collectVideos(prepared),
    images: collectImages(prepared),
    title: split.title,
    author: split.author,
    durationMs: durationMatch ? Number(durationMatch[1]) : null,
    unavailable,
  };
}

export function videoIdFromUrl(input: string): string | null {
  try {
    const url = new URL(input);
    for (const key of ["v", "video_id", "story_fbid", "fbid"]) {
      const value = url.searchParams.get(key);
      if (value && /^\d{5,}$/.test(value)) return value;
    }
    const match = url.pathname.match(/\/(?:reel|videos|video|posts|photos|stories)\/(?:[^/]+\/)?(\d{6,})/);
    if (match) return match[1];
    const tail = url.pathname.match(/\/(\d{8,})\/?$/);
    return tail?.[1] ?? null;
  } catch {
    return null;
  }
}

export function inferKind(pageUrl: string, clips: number, images: number): MediaKind {
  const path = pageUrl.toLowerCase();
  if (path.includes("/stories") || path.includes("story.php") || path.includes("story_fbid")) return "story";
  if (path.includes("/reel/") || path.includes("/share/r/")) return clips > 0 ? "reel" : images > 0 ? "photo" : "reel";
  if (clips === 0 && images > 1) return "album";
  if (clips === 0 && images > 0) return "photo";
  if (path.includes("/photo") || path.includes("fbid=")) return clips > 0 ? "video" : "photo";
  return clips > 0 ? "video" : "post";
}

function labelFor(height: number | null, bitrate: number | null, index: number): string {
  if (height) return `${height}p`;
  if (bitrate) return `${Math.round(bitrate / 1000)} kbps`;
  return index === 0 ? "Original" : `Option ${index + 1}`;
}

export function focusVideos(videos: RawVideo[], pageUrl: string): RawVideo[] {
  if (videos.length === 0) return videos;
  const hinted = videoIdFromUrl(pageUrl);
  if (hinted) {
    const owned = videos.filter((video) => video.ownerId === hinted);
    if (owned.length > 0) return owned;
  }
  const ordered = [...videos].sort((a, b) => a.index - b.index);
  const first = ordered[0];
  if (!first) return [];
  const nearby = new Set(
    ordered
      .filter((video) => video.ownerId && video.index <= first.index + 120_000)
      .map((video) => video.ownerId),
  );
  if (nearby.size === 0) return ordered.slice(0, 4);
  return ordered.filter((video) => video.ownerId != null && nearby.has(video.ownerId));
}

export function assemble(
  collected: Collected,
  pageUrl: string,
  sizes: Map<string, number | null>,
): ResolveOk {
  const ranked = focusVideos(collected.videos, pageUrl).sort((a, b) => a.index - b.index);
  const groups = new Map<string, RawVideo[]>();
  for (const video of ranked) {
    const key = video.ownerId ?? "one";
    const group = groups.get(key) ?? [];
    group.push(video);
    groups.set(key, group);
  }

  const clips: Clip[] = [...groups.values()].map((group, index) => {
    const byHeight = new Map<number, RawVideo>();
    const unknown: RawVideo[] = [];
    for (const video of group) {
      if (video.height == null) {
        unknown.push(video);
        continue;
      }
      const height = snapHeight(video.height);
      const previous = byHeight.get(height);
      if (!previous || better(video, previous, sizes)) byHeight.set(height, { ...video, height });
    }
    let chosen = [...byHeight.values()];
    const knownPaths = new Set(chosen.map((video) => pathOf(video.url)));
    for (const video of unknown) {
      const path = pathOf(video.url);
      if (path && knownPaths.has(path)) continue;
      if (path) knownPaths.add(path);
      chosen.push(video);
    }
    chosen.sort((a, b) => {
      const heightDelta = (b.height ?? 0) - (a.height ?? 0);
      if (heightDelta !== 0) return heightDelta;
      return (sizes.get(b.url) ?? b.bitrate ?? 0) - (sizes.get(a.url) ?? a.bitrate ?? 0);
    });
    const variants: Variant[] = chosen.slice(0, 5).map((video, variantIndex) => ({
      label: labelFor(video.height, video.bitrate, variantIndex),
      height: video.height,
      bitrate: video.bitrate,
      bytes: sizes.get(video.url) ?? null,
      ext: extOf(video.url, "mp4"),
      url: video.url,
    }));
    return { id: `clip-${index + 1}`, variants };
  }).filter((clip) => clip.variants.length > 0);

  const coverOnly = clips.length > 0;
  const sortedImages = [...collected.images].sort((a, b) => {
    if (a.trusted !== b.trusted) return a.trusted ? -1 : 1;
    return (b.width ?? 0) * (b.height ?? 0) - (a.width ?? 0) * (a.height ?? 0);
  });
  const images: ImageItem[] = (coverOnly ? sortedImages.slice(0, 1) : sortedImages.slice(0, 18)).map(
    (image) => ({
      url: image.url,
      width: image.width,
      height: image.height,
      ext: extOf(image.url, "jpg"),
    }),
  );

  const durationFromVideo = ranked.find((video) => video.durationS)?.durationS;
  return {
    sourceUrl: pageUrl,
    title: collected.title,
    author: collected.author,
    kind: inferKind(pageUrl, clips.length, images.length),
    durationMs: collected.durationMs ?? (durationFromVideo ? Math.round(durationFromVideo * 1000) : null),
    clips,
    images,
  };
}

function better(next: RawVideo, prev: RawVideo, sizes: Map<string, number | null>): boolean {
  const nextBytes = sizes.get(next.url) ?? 0;
  const prevBytes = sizes.get(prev.url) ?? 0;
  if (nextBytes !== prevBytes) return nextBytes > prevBytes;
  return (next.bitrate ?? 0) > (prev.bitrate ?? 0);
}

export function directMedia(url: string): ResolveOk | null {
  if (!hostOk(url)) return null;
  const video = /\.(?:mp4|mov|webm)(?:$|\?)/i.test(url);
  const image = /\.(?:jpe?g|png|webp|gif)(?:$|\?)/i.test(url) || /stp=dst-(?:jpg|png|webp)/i.test(url);
  if (!video && !image) return null;
  if (video) {
    const quality = qualityFromUrl(url, null);
    const variant: Variant = {
      label: quality.height ? `${snapHeight(quality.height)}p` : "Original",
      height: quality.height ? snapHeight(quality.height) : null,
      bitrate: quality.bitrate,
      bytes: null,
      ext: extOf(url, "mp4"),
      url,
    };
    return {
      sourceUrl: url,
      title: "Facebook video",
      author: null,
      kind: "video",
      durationMs: quality.durationS ? Math.round(quality.durationS * 1000) : null,
      clips: [{ id: "clip-1", variants: [variant] }],
      images: [],
    };
  }
  const dims = readDims(url);
  return {
    sourceUrl: url,
    title: "Facebook photo",
    author: null,
    kind: "photo",
    durationMs: null,
    clips: [],
    images: [
      {
        url,
        width: dims?.width ?? null,
        height: dims?.height ?? null,
        ext: extOf(url, "jpg"),
      },
    ],
  };
}
