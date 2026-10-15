import { useEffect, useState } from "react";
import {
  CircleAlert,
  Clapperboard,
  Clock3,
  Download,
  Film,
  Image as ImageIcon,
  Link2,
  Loader2,
  X,
} from "lucide-react";
import type { ImageItem, MediaKind, ResolveOk, Variant } from "@/lib/facebook/types";

const RECENT_KEY = "halden.recent";

type Recent = {
  url: string;
  title: string;
  kind: MediaKind;
  at: number;
};

const KIND_LABEL: Record<MediaKind, string> = {
  video: "Video",
  reel: "Reel",
  photo: "Photo",
  story: "Story",
  album: "Album",
  post: "Post",
};

const HINTS = [
  "facebook.com/reel/…",
  "facebook.com/watch/?v=…",
  "fb.watch/…",
  "facebook.com/photo/?fbid=…",
  "facebook.com/stories/…",
];

function extractCandidate(text: string): string {
  const match = text.match(/https?:\/\/[^\s]+/i);
  return (match?.[0] ?? text).trim().replace(/[),.\]]+$/, "");
}

function formatBytes(bytes: number | null): string | null {
  if (!bytes || bytes < 1) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(bytes >= 10 * 1024 * 1024 ? 0 : 1)} MB`;
}

function formatRate(bitrate: number | null): string | null {
  if (!bitrate) return null;
  if (bitrate >= 1_000_000) return `${(bitrate / 1_000_000).toFixed(1)} Mbps`;
  return `${Math.round(bitrate / 1000)} kbps`;
}

function formatDuration(ms: number | null): string | null {
  if (!ms || ms < 500) return null;
  const total = Math.round(ms / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function slug(value: string): string {
  const cleaned = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return cleaned || "facebook-media";
}

function fileHref(url: string, name: string, inline = false): string {
  const params = new URLSearchParams({ src: url, name });
  if (inline) params.set("inline", "1");
  return `/api/media?${params.toString()}`;
}

function variantName(title: string, variant: Variant, index: number): string {
  return `${slug(title)}-${variant.label.replace(/\s+/g, "").toLowerCase() || index + 1}.${variant.ext}`;
}

function imageName(title: string, image: ImageItem, index: number): string {
  return `${slug(title)}-${index + 1}.${image.ext}`;
}

function readRecent(): Recent[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]") as Recent[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => item && typeof item.url === "string" && typeof item.title === "string")
      .slice(0, 6);
  } catch {
    return [];
  }
}

function pushRecent(item: Recent) {
  const next = [item, ...readRecent().filter((entry) => entry.url !== item.url)].slice(0, 6);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  return next;
}

export function Saver() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResolveOk | null>(null);
  const [recent, setRecent] = useState<Recent[]>([]);

  useEffect(() => {
    setRecent(readRecent());
  }, []);

  async function resolve(raw: string) {
    const nextUrl = extractCandidate(raw);
    if (!nextUrl) {
      setError("Paste a Facebook link first.");
      return;
    }
    setUrl(nextUrl);
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/resolve", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: nextUrl }),
      });
      const data = (await response.json()) as ResolveOk & { error?: string };
      if (!response.ok) throw new Error(data.error || "Couldn’t read that link.");
      setResult(data);
      setRecent(pushRecent({ url: nextUrl, title: data.title, kind: data.kind, at: Date.now() }));
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "Couldn’t read that link.");
    } finally {
      setLoading(false);
    }
  }

  const duration = formatDuration(result?.durationMs ?? null);
  const best = result?.clips[0]?.variants[0];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-8 sm:px-6 sm:py-14">
      <header className="enter flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="mark flex size-11 items-center justify-center rounded-xl bg-primary text-primary-fg">
            <Download className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="font-display text-xl leading-none font-semibold tracking-tight">Halden</p>
            <p className="mt-1 text-sm text-muted">Public Facebook saver</p>
          </div>
        </div>
        <p className="hidden text-sm text-faint sm:block">No login · no password</p>
      </header>

      <section className="mt-10 sm:mt-14">
        <h1 className="font-display text-4xl leading-tight font-semibold tracking-tight text-balance sm:text-5xl">
          <span className="enter d2 block">Save the video, reel, or photo</span>
          <span className="enter d3 block">behind a public link.</span>
        </h1>
        <p className="enter d4 mt-4 max-w-2xl text-base text-muted sm:text-lg">
          Paste a Facebook, fb.watch, or fb.me address. Halden reads the public page and gives you the real file —
          highest quality first.
        </p>

        <form
          id="save-form"
          className="enter d5 mt-8 flex flex-col gap-3 sm:flex-row"
          action=""
          onSubmit={(event) => {
            event.preventDefault();
            void resolve(url);
          }}
        >
          <label className="sr-only" htmlFor="facebook-url">
            Facebook link
          </label>
          <div className="relative min-w-0 flex-1">
            <Link2 className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-faint" />
            <input
              id="facebook-url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="Paste a public Facebook link"
              inputMode="url"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              onKeyDown={(event) => {
                if (event.key !== "Enter") return;
                event.preventDefault();
                void resolve(url);
              }}
              className="field h-12 w-full rounded-xl border border-border bg-surface pr-12 pl-11 text-base text-fg outline-none placeholder:text-faint"
            />
            {url ? (
              <button
                type="button"
                className="press absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg"
                onClick={() => {
                  setUrl("");
                  setError(null);
                }}
                aria-label="Clear link"
              >
                <X className="size-4" />
              </button>
            ) : null}
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              void resolve(url);
            }}
            className="press inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-base font-medium text-primary-fg hover:opacity-90 disabled:opacity-60"
          >
            <span className="relative grid size-5 place-items-center">
              <Download className={`icon-swap col-start-1 row-start-1 size-5 ${loading ? "icon-off" : "icon-on"}`} aria-hidden="true" />
              <Loader2 className={`icon-swap col-start-1 row-start-1 size-5 ${loading ? "icon-on animate-spin motion-reduce:animate-none" : "icon-off"}`} aria-hidden="true" />
            </span>
            {loading ? "Reading" : "Fetch media"}
          </button>
        </form>

        <ul className="enter d6 mt-4 flex flex-wrap gap-2">
          {HINTS.map((hint) => (
            <li key={hint} className="rounded-full border border-border px-3 py-1 text-xs text-faint">
              {hint}
            </li>
          ))}
        </ul>

        {error ? (
          <p role="alert" className="enter mt-4 flex items-start gap-2 text-sm text-fg">
            <CircleAlert className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            <span>{error}</span>
          </p>
        ) : null}
      </section>

      {loading && !result ? (
        <div className="enter mt-10" role="status">
          <p className="text-sm text-muted">Opening the public page and picking the best file…</p>
          <div className="relative mt-4 h-1 overflow-hidden rounded-full bg-surface-2">
            <span className="scan-bar" />
          </div>
          <div className="mt-4 space-y-3">
            <div className="shimmer h-48 rounded-xl" />
            <div className="shimmer h-12 rounded-xl" />
            <div className="shimmer h-12 w-2/3 rounded-xl" />
          </div>
        </div>
      ) : null}

      {result ? (
        <section className="enter relative mt-10 overflow-hidden rounded-lg border border-border bg-surface p-4 sm:p-5" aria-live="polite" aria-busy={loading}>
          {loading ? (
            <div className="absolute inset-x-0 top-0 h-1 overflow-hidden bg-surface-2">
              <span className="scan-bar" />
            </div>
          ) : null}
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 text-fg">
              <KindIcon kind={result.kind} />
              {KIND_LABEL[result.kind]}
            </span>
            {duration ? (
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="size-4" aria-hidden="true" />
                {duration}
              </span>
            ) : null}
            {result.author ? <span className="text-muted">{result.author}</span> : null}
          </div>
          <h2 className="mt-3 font-display text-2xl leading-snug font-semibold text-balance">{result.title}</h2>

          {best ? (
            <video
              key={best.url}
              className="media-in enter mt-4 max-h-player w-full rounded-xl bg-bg"
              controls
              playsInline
              preload="metadata"
              poster={result.images[0] ? fileHref(result.images[0].url, "cover.jpg", true) : undefined}
              src={fileHref(best.url, variantName(result.title, best, 0), true)}
            />
          ) : null}

          {result.clips.map((clip, clipIndex) => (
            <div key={clip.id} className={clipIndex === 0 ? "mt-4" : "mt-6"}>
              {result.clips.length > 1 ? (
                <h3 className="mb-2 text-sm font-medium text-muted">Clip {clipIndex + 1}</h3>
              ) : (
                <h3 className="mb-2 text-sm font-medium text-muted">Qualities</h3>
              )}
              <ul className="stagger divide-y divide-border overflow-hidden rounded-xl border border-border">
                {clip.variants.map((variant, index) => {
                  const name = variantName(result.title, variant, index);
                  const size = formatBytes(variant.bytes);
                  const rate = formatRate(variant.bitrate);
                  return (
                    <li key={variant.url} className="flex items-center justify-between gap-3 bg-bg px-3 py-2.5">
                      <div className="min-w-0">
                        <p className="font-medium">{variant.label}</p>
                        <p className="text-sm text-muted">
                          {[size, rate, variant.ext.toUpperCase()].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      <a
                        href={fileHref(variant.url, name)}
                        className={
                          index === 0 && clipIndex === 0
                            ? "press inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-primary px-3 text-sm font-medium text-primary-fg"
                            : "press inline-flex h-11 shrink-0 items-center gap-2 rounded-xl border border-border px-3 text-sm font-medium text-fg"
                        }
                      >
                        <Download className="size-4" aria-hidden="true" />
                        Save
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {result.images.length > 0 && result.clips.length > 0 ? (
            <a
              href={fileHref(result.images[0].url, imageName(result.title, result.images[0], 0))}
              className="press mt-4 inline-flex h-11 items-center gap-2 text-sm font-medium text-muted hover:text-fg"
            >
              <ImageIcon className="size-4" aria-hidden="true" />
              Save cover image
            </a>
          ) : null}

          {result.images.length > 0 && result.clips.length === 0 ? (
            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between gap-3">
                <h3 className="text-sm font-medium text-muted">{result.images.length > 1 ? "Photos" : "Photo"}</h3>
                {result.images.length > 1 ? (
                  <button
                    type="button"
                    className="press inline-flex h-11 items-center gap-2 rounded-xl border border-border px-3 text-sm font-medium"
                    onClick={() => {
                      result.images.forEach((image, index) => {
                        const anchor = document.createElement("a");
                        anchor.href = fileHref(image.url, imageName(result.title, image, index));
                        anchor.rel = "noopener";
                        document.body.appendChild(anchor);
                        anchor.click();
                        anchor.remove();
                      });
                    }}
                  >
                    <Download className="size-4" aria-hidden="true" />
                    Save all
                  </button>
                ) : null}
              </div>
              <ul className="stagger grid grid-cols-2 gap-3 sm:grid-cols-3">
                {result.images.map((image, index) => {
                  const name = imageName(result.title, image, index);
                  return (
                    <li key={image.url} className="overflow-hidden rounded-xl border border-border bg-bg">
                      <img src={fileHref(image.url, name, true)} alt="" className="aspect-square w-full object-cover" />
                      <a
                        href={fileHref(image.url, name)}
                        className="flex h-11 items-center justify-center gap-2 text-sm font-medium text-fg"
                      >
                        <Download className="size-4" aria-hidden="true" />
                        Save
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}

      {recent.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-sm font-medium text-muted">Recent</h2>
          <ul className="stagger mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border">
            {recent.map((item) => (
              <li key={item.url}>
                <button
                  type="button"
                  className="press flex w-full items-center gap-3 px-3 py-3 text-left transition-colors duration-200 hover:bg-surface"
                  onClick={() => void resolve(item.url)}
                >
                  <KindIcon kind={item.kind} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{item.title}</span>
                    <span className="block truncate text-sm text-faint">{item.url}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <footer className="mt-auto pt-12 text-sm text-faint">
        Halden only saves media Facebook already serves on a public link. Private posts and most stories stay
        locked, and it will not ask for your Facebook password. Keep copies only when you have the right to.
      </footer>
    </main>
  );
}

function KindIcon({ kind }: { kind: MediaKind }) {
  const className = "size-4 shrink-0 text-primary";
  if (kind === "photo" || kind === "album") return <ImageIcon className={className} aria-hidden="true" />;
  if (kind === "reel" || kind === "story") return <Clapperboard className={className} aria-hidden="true" />;
  if (kind === "video") return <Film className={className} aria-hidden="true" />;
  return <Link2 className={className} aria-hidden="true" />;
}
