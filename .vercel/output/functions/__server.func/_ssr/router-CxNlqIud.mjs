import { i as __toESM, n as __exportAll } from "../_runtime.mjs";
import { K as require_react, _ as createFileRoute, b as require_jsx_runtime, d as Scripts, f as HeadContent, g as lazyRouteComponent, h as Outlet, m as createRouter, v as createRootRoute, y as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as TriangleAlert } from "../_libs/lucide-react.mjs";
import { a as union, i as string, n as number, r as object, t as literal } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/router-CxNlqIud.js
var router_CxNlqIud_exports = /* @__PURE__ */ __exportAll({ getRouter: () => getRouter });
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var FALLBACK_MESSAGE = "An unexpected error occurred. Try reloading the page.";
function errorMessage(error) {
	if (error instanceof Error && error.message) return error.message;
	if (typeof error === "string" && error) return error;
	return FALLBACK_MESSAGE;
}
function AppErrorComponent({ error }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "flex min-h-screen flex-col items-center justify-center gap-3 bg-bg px-6 text-center text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-primary",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
					className: "size-10",
					strokeWidth: 2
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-lg font-semibold",
				children: "Something went wrong"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "max-w-md text-sm break-words text-muted",
				children: errorMessage(error)
			})
		]
	});
}
/**
* App-wide client provider mounted once near the root (in `src/routes/__root.tsx`):
*
*   <AuthProvider><Outlet /></AuthProvider>
*
* Better Auth's React client (`@/lib/auth/client`) needs NO context provider —
* its `useSession()` works standalone — so this is a passthrough today. It's
* kept as the single, stable mount point for any future client-side providers
* (e.g. a toast or theme provider) without churning the root shell.
*/
function AuthProvider({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
var CONNECTOR_TOKEN_READY_EVENT = "grok:connector-token-ready";
function isGrokEmbedderOrigin(origin) {
	try {
		const url = new URL(origin);
		if (url.protocol !== "https:" && url.protocol !== "http:") return false;
		const host = url.hostname.toLowerCase();
		if (host === "grok.com" || host.endsWith(".grok.com")) return true;
		if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") return true;
		return false;
	} catch {
		return false;
	}
}
function isSandboxPreviewGuestHost(hostname) {
	const host = hostname.toLowerCase();
	return host === "grok-sandbox.com" || host.endsWith(".grok-sandbox.com");
}
function isRemintPreviewPair(guestHost, parentHost) {
	const guest = guestHost.toLowerCase();
	const parent = parentHost.toLowerCase();
	const i = guest.indexOf(".preview.");
	if (i <= 0) return false;
	const label = guest.slice(0, i);
	const rest = guest.slice(i + 9);
	if (label.includes(".") || !rest.includes(".")) return false;
	return parent === rest || parent === `grok.${rest}`;
}
function resolveParentEmbedderOrigin(parentIsSelf, referrer, ancestorOrigin, guestHostname = "") {
	if (parentIsSelf) return null;
	for (const candidate of [referrer, ancestorOrigin ?? ""].filter(Boolean)) try {
		const url = new URL(candidate.includes("://") ? candidate : `https://${candidate}`);
		if (url.protocol !== "https:" && url.protocol !== "http:") continue;
		if (isGrokEmbedderOrigin(url.origin)) return url.origin;
		if (isSandboxPreviewGuestHost(guestHostname) || isRemintPreviewPair(guestHostname, url.hostname)) return url.origin;
	} catch {}
	return null;
}
/**
* Guest side of the grok-web ↔ sandbox preview postMessage bridge.
*
* Activates only when this page is framed by an allowlisted Grok embedder.
* Top-level runs (download/export, local `npm run dev`, deployed sites) noop.
*/
var PREVIEW_BRIDGE_CHANNEL = "grok-preview-bridge";
var EnvelopeSchema = object({
	channel: literal(PREVIEW_BRIDGE_CHANNEL),
	version: number().int().positive(),
	type: string().min(1)
});
var HelloSchema = EnvelopeSchema.extend({ type: literal("hello") });
var NavigateSchema = EnvelopeSchema.extend({
	type: literal("navigate"),
	path: string().min(1)
});
var HistorySchema = EnvelopeSchema.extend({
	type: literal("history"),
	delta: union([literal(-1), literal(1)])
});
var ConnectorTokenReadySchema = EnvelopeSchema.extend({ type: literal("connector-token-ready") });
function isSafeBridgePath(path) {
	if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return false;
	try {
		return new URL(path, "https://preview.invalid").origin === "https://preview.invalid";
	} catch {
		return false;
	}
}
/**
* Origin of the Grok embedder framing this page, or null when the page runs
* top-level (download/export, local `npm run dev`, deployed sites) or under a
* non-Grok parent. Client-only; null during SSR.
*/
function resolveCurrentEmbedderOrigin() {
	if (typeof window === "undefined") return null;
	const ancestorOrigin = typeof location.ancestorOrigins !== "undefined" && location.ancestorOrigins.length > 0 ? location.ancestorOrigins[0] : null;
	return resolveParentEmbedderOrigin(window.parent === window, document.referrer, ancestorOrigin, window.location.hostname);
}
/**
* Install host↔guest messaging. Returns a dispose function.
* Noops (returns a no-op dispose) when not embedded under a Grok parent.
*/
function installPreviewHostBridge(options = {}) {
	const parentOrigin = resolveCurrentEmbedderOrigin();
	if (parentOrigin === null) return () => {};
	const ROOT_STATE_KEY = "__grokPreviewBridgeRoot";
	const originalPushState = window.history.pushState.bind(window.history);
	const originalReplaceState = window.history.replaceState.bind(window.history);
	const isAtHistoryRoot = () => {
		const state = window.history.state;
		return Boolean(state && typeof state === "object" && state[ROOT_STATE_KEY] === true);
	};
	try {
		const current = window.history.state;
		if (!(current !== null && typeof current === "object" && Object.prototype.hasOwnProperty.call(current, ROOT_STATE_KEY))) {
			const isRoot = window.history.length <= 1;
			originalReplaceState(current && typeof current === "object" ? {
				...current,
				[ROOT_STATE_KEY]: isRoot
			} : { [ROOT_STATE_KEY]: isRoot }, "", window.location.href);
		}
	} catch {}
	const post = (message) => {
		window.parent.postMessage(message, parentOrigin);
	};
	const reportLocation = () => {
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "location",
			path: window.location.pathname || "/",
			search: window.location.search,
			hash: window.location.hash
		});
	};
	const reportRoutes = () => {
		const paths = options.getRoutePaths?.() ?? [];
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "routes",
			paths
		});
	};
	const defaultNavigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		try {
			const url = new URL(path, window.location.origin);
			if (url.origin !== window.location.origin) return;
			const next = `${url.pathname}${url.search}${url.hash}`;
			window.history.pushState(window.history.state, "", next);
			window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
		} catch {}
	};
	const navigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		if (options.navigate) {
			options.navigate(path);
			return;
		}
		defaultNavigate(path);
	};
	const announce = () => {
		reportLocation();
		reportRoutes();
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "ready"
		});
	};
	const onHello = (data) => {
		if (!HelloSchema.safeParse(data).success) return;
		announce();
	};
	const onNavigate = (data) => {
		const parsed = NavigateSchema.safeParse(data);
		if (!parsed.success) return;
		navigate(parsed.data.path);
		queueMicrotask(reportLocation);
	};
	const onHistory = (data) => {
		const parsed = HistorySchema.safeParse(data);
		if (!parsed.success) return;
		if (parsed.data.delta === -1 && isAtHistoryRoot()) return;
		window.history.go(parsed.data.delta);
	};
	const onConnectorTokenReady = (data) => {
		if (!ConnectorTokenReadySchema.safeParse(data).success) return;
		window.dispatchEvent(new Event(CONNECTOR_TOKEN_READY_EVENT));
	};
	const hostMessageHandlers = /* @__PURE__ */ new Map([
		["hello", onHello],
		["navigate", onNavigate],
		["history", onHistory],
		["connector-token-ready", onConnectorTokenReady]
	]);
	const onMessage = (event) => {
		if (event.source !== window.parent) return;
		if (event.origin !== parentOrigin) return;
		const envelope = EnvelopeSchema.safeParse(event.data);
		if (!envelope.success || envelope.data.version !== 1) return;
		hostMessageHandlers.get(envelope.data.type)?.(event.data);
	};
	const onPopState = () => {
		reportLocation();
	};
	const onHashChange = () => {
		reportLocation();
	};
	window.history.pushState = (data, unused, url) => {
		const next = data && typeof data === "object" ? {
			...data,
			[ROOT_STATE_KEY]: false
		} : data;
		originalPushState(next, unused, url);
		reportLocation();
	};
	window.history.replaceState = (data, unused, url) => {
		const next = isAtHistoryRoot() ? {
			...data && typeof data === "object" ? data : {},
			[ROOT_STATE_KEY]: true
		} : data;
		originalReplaceState(next, unused, url);
		reportLocation();
	};
	window.addEventListener("message", onMessage);
	window.addEventListener("popstate", onPopState);
	window.addEventListener("hashchange", onHashChange);
	announce();
	return () => {
		window.removeEventListener("message", onMessage);
		window.removeEventListener("popstate", onPopState);
		window.removeEventListener("hashchange", onHashChange);
		window.history.pushState = originalPushState;
		window.history.replaceState = originalReplaceState;
	};
}
/** Collect static path patterns from a TanStack route tree (best-effort). */
function collectRoutePathsFromTree(routeTree) {
	const paths = /* @__PURE__ */ new Set();
	const walk = (node) => {
		if (!node || typeof node !== "object") return;
		const record = node;
		const full = typeof record.fullPath === "string" ? record.fullPath : typeof record.path === "string" ? record.path : null;
		if (full !== null && full !== "") paths.add(full.startsWith("/") ? full : `/${full}`);
		else if (full === "") paths.add("/");
		const children = record.children;
		if (Array.isArray(children)) for (const child of children) walk(child);
		else if (children && typeof children === "object") for (const child of Object.values(children)) walk(child);
	};
	walk(routeTree);
	return [...paths];
}
/**
* Mount once in `__root.tsx` so the Grok preview chrome can drive navigation
* (and later receive registered routes). Noops when the app is not embedded.
*/
function PreviewHostBridge() {
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		return installPreviewHostBridge({
			navigate: (path) => {
				router.history.push(path);
			},
			getRoutePaths: () => collectRoutePathsFromTree(router.routeTree)
		});
	}, [router]);
	return null;
}
var styles_default = "/assets/styles-CpuIwKGt.css";
var APP_NAME = "Halden";
var Route$3 = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: APP_NAME },
			{
				name: "description",
				content: "Save public Facebook videos, reels, photos, albums, and stories from a link. No login."
			},
			{
				name: "theme-color",
				content: "#14120e"
			}
		],
		links: [
			{
				rel: "icon",
				type: "image/svg+xml",
				href: "/favicon.svg"
			},
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,560;9..144,650&family=Outfit:wght@400;500;600&display=swap"
			},
			{
				rel: "manifest",
				href: "/__grok/manifest.webmanifest"
			},
			{
				rel: "apple-touch-icon",
				href: "/__grok/icon-180.png"
			}
		]
	}),
	component: () => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		suppressHydrationWarning: true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", {
			className: "bg-bg font-sans text-fg antialiased",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("script", { dangerouslySetInnerHTML: { __html: "document.addEventListener('submit',function(e){var t=e.target;if(t&&t.id==='save-form')e.preventDefault();},true)" } }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PreviewHostBridge, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})
			]
		})]
	})
});
var $$splitComponentImporter = () => import("./routes-B3pQidHN.mjs");
var Route$2 = createFileRoute("/")({ component: lazyRouteComponent($$splitComponentImporter, "component") });
var PAGE_HOST = /^(?:[a-z0-9-]+\.)*(?:facebook\.com|fb\.com|fb\.watch|fb\.me|fb\.gg)$/i;
var MEDIA_HOST = /^(?:[a-z0-9-]+\.)*(?:fbcdn\.net|fbsbx\.com)$/i;
function isPageHost(hostname) {
	return PAGE_HOST.test(hostname);
}
function isMediaHost(hostname) {
	return MEDIA_HOST.test(hostname);
}
function assertPublicHttp(url) {
	if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("Only public http(s) links work.");
	if (url.username || url.password) throw new Error("Links with embedded passwords aren’t accepted.");
	if (url.port && url.port !== "443" && url.port !== "80") throw new Error("That link uses a port this saver won’t open.");
}
var PAGE_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
var MEDIA_UA = "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)";
var SaveError = class extends Error {
	status;
	constructor(message, status = 400) {
		super(message);
		this.status = status;
	}
};
function allowHost(hostname, kind) {
	return kind === "page" ? isPageHost(hostname) : isMediaHost(hostname);
}
async function fetchChecked(start, kind, init) {
	let current = new URL(start);
	assertPublicHttp(current);
	if (!allowHost(current.hostname, kind)) throw new SaveError(kind === "page" ? "Paste a public Facebook, fb.watch, or fb.me link." : "That file isn’t hosted on Facebook’s media network.");
	const timeoutMs = init.timeoutMs ?? 12e3;
	for (let hop = 0; hop < 5; hop += 1) {
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), timeoutMs);
		const onAbort = () => controller.abort();
		init.signal?.addEventListener("abort", onAbort);
		try {
			const response = await fetch(current, {
				headers: init.headers,
				redirect: "manual",
				signal: controller.signal
			});
			if (response.status >= 300 && response.status < 400) {
				const location = response.headers.get("location");
				await response.body?.cancel();
				if (!location) throw new SaveError("Facebook redirected without a destination.", 502);
				const next = new URL(location, current);
				assertPublicHttp(next);
				if (!allowHost(next.hostname, kind)) throw new SaveError("Facebook sent that link somewhere this saver won’t follow.", 502);
				current = next;
				continue;
			}
			return response;
		} catch (error) {
			if (error instanceof SaveError) throw error;
			if (error instanceof Error && error.name === "AbortError") throw new SaveError("Facebook took too long to answer. Try the link again.", 504);
			throw new SaveError("Facebook didn’t respond. Try the link again.", 502);
		} finally {
			clearTimeout(timer);
			init.signal?.removeEventListener("abort", onAbort);
		}
	}
	throw new SaveError("That link redirected too many times.", 502);
}
function pageHeaders() {
	return new Headers({
		"user-agent": PAGE_UA,
		accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
		"accept-language": "en-US,en;q=0.9",
		"sec-fetch-dest": "document",
		"sec-fetch-mode": "navigate",
		"sec-fetch-site": "none",
		"upgrade-insecure-requests": "1"
	});
}
async function readHtml(response, maxBytes = 4e6) {
	const reader = response.body?.getReader();
	if (!reader) return "";
	const chunks = [];
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
async function probeBytes(url) {
	try {
		const response = await fetchChecked(url, "media", {
			headers: new Headers({
				"user-agent": MEDIA_UA,
				range: "bytes=0-0",
				accept: "*/*"
			}),
			timeoutMs: 8e3
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
function json$1(body, status = 400) {
	return new Response(JSON.stringify(body), {
		status,
		headers: {
			"content-type": "application/json; charset=utf-8",
			"cache-control": "no-store"
		}
	});
}
function safeName(raw, fallback) {
	return (raw ?? "").replace(/[/\\?%*:|"<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 80) || fallback;
}
async function handle$1({ request }) {
	const query = new URL(request.url).searchParams;
	const src = query.get("src") ?? "";
	const inline = query.get("inline") === "1";
	if (!src) return json$1({ error: "Missing file." });
	try {
		const headers = new Headers({
			"user-agent": MEDIA_UA,
			accept: "*/*"
		});
		const range = request.headers.get("range");
		if (range && /^bytes=\d*-\d*$/.test(range)) headers.set("range", range);
		const upstream = await fetchChecked(src, "media", {
			headers,
			timeoutMs: 2e4
		});
		const type = upstream.headers.get("content-type") ?? "";
		const okType = /^(video\/|image\/|application\/octet-stream|application\/mp4)/i.test(type);
		if (!upstream.ok && upstream.status !== 206) {
			await upstream.body?.cancel();
			return json$1({ error: "Facebook refused that file. The link may have expired — fetch it again." }, 502);
		}
		if (type && !okType) {
			await upstream.body?.cancel();
			return json$1({ error: "Facebook didn’t return a media file." }, 502);
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
			const ext = type.includes("png") ? "png" : type.includes("webp") ? "webp" : type.includes("gif") ? "gif" : type.startsWith("image/") ? "jpg" : "mp4";
			const name = safeName(query.get("name"), `facebook-media.${ext}`);
			out.set("content-disposition", `attachment; filename="${name}"; filename*=UTF-8''${encodeURIComponent(name)}`);
		}
		return new Response(upstream.body, {
			status: upstream.status,
			headers: out
		});
	} catch (error) {
		if (error instanceof SaveError) return json$1({ error: error.message }, error.status);
		return json$1({ error: "Couldn’t download that file." }, 502);
	}
}
var Route$1 = createFileRoute("/api/media")({ server: { handlers: { GET: handle$1 } } });
var VIDEO_KEYS = [
	{
		key: "browser_native_hd_url",
		hint: null
	},
	{
		key: "browser_native_sd_url",
		hint: null
	},
	{
		key: "playable_url_quality_hd",
		hint: 720
	},
	{
		key: "playable_url",
		hint: 360
	},
	{
		key: "progressive_url",
		hint: null
	},
	{
		key: "video_hd_url",
		hint: 720
	},
	{
		key: "video_sd_url",
		hint: 360
	},
	{
		key: "watermarked_video_hd_url",
		hint: 720
	},
	{
		key: "watermarked_video_sd_url",
		hint: 360
	},
	{
		key: "hd_src",
		hint: 720
	},
	{
		key: "sd_src",
		hint: 360
	}
];
var LADDER = [
	240,
	270,
	360,
	480,
	540,
	576,
	640,
	720,
	960,
	1080,
	1440,
	2160
];
function snapHeight(height) {
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
function unescapeHtml(value) {
	const named = [
		["amp", "&"],
		["quot", "\""],
		["apos", "'"],
		["lt", "<"],
		["gt", ">"],
		["nbsp", " "]
	];
	let out = value;
	for (let pass = 0; pass < 4; pass += 1) {
		let next = out;
		for (const [name, char] of named) next = next.split("&" + name + ";").join(char);
		next = next.replace(/&#x([0-9a-f]+);/gi, (_, hex) => fromPoint(Number.parseInt(hex, 16))).replace(/&#(\d+);/g, (_, num) => fromPoint(Number.parseInt(num, 10)));
		if (next === out) break;
		out = next;
	}
	return out;
}
function decodeEntities(value) {
	return unescapeHtml(value);
}
function fromPoint(code) {
	if (!Number.isFinite(code) || code < 0 || code > 1114111) return "";
	try {
		return String.fromCodePoint(code);
	} catch {
		return "";
	}
}
function preprocess(html) {
	return unescapeHtml(html.replace(/\\u0022/gi, "\"").replace(/\\u0025/gi, "%").replace(/\\u0026/gi, "&").replace(/\\u003a/gi, ":").replace(/\\u002f/gi, "/").replace(/\\u003d/gi, "=").replace(/\\u003f/gi, "?").replace(/\\\//g, "/"));
}
function metaContent(html, key) {
	const re = new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]*content=["']([^"']*)["']|<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${key}["']`, "i");
	const match = html.match(re);
	const value = match?.[1] || match?.[2];
	if (!value) return null;
	return decodeEntities(value).replace(/\s+/g, " ").trim() || null;
}
function splitTitle(raw) {
	const parts = raw.split("|").map((part) => part.trim()).filter(Boolean);
	if (parts.length < 2) return {
		title: raw,
		author: null
	};
	const author = parts[parts.length - 1] ?? null;
	return {
		title: parts.slice(0, -1).map((part) => part.replace(/^[\d.,]+[KMB]?\s+views\s*(?:·|•)\s*[\d.,]+[KMB]?\s+reactions\s*/i, "").trim()).filter(Boolean).join(" · ") || raw,
		author
	};
}
function pathOf(url) {
	try {
		return new URL(url).pathname;
	} catch {
		return null;
	}
}
function hostOk(url) {
	try {
		const parsed = new URL(url);
		return parsed.protocol === "https:" && isMediaHost(parsed.hostname);
	} catch {
		return false;
	}
}
function decodeB64(value) {
	try {
		const pad = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - value.length % 4) % 4);
		const bytes = Uint8Array.from(atob(pad), (char) => char.charCodeAt(0));
		return new TextDecoder().decode(bytes);
	} catch {
		return null;
	}
}
function qualityFromUrl(url, hint) {
	let height = hint;
	let bitrate = null;
	let durationS = null;
	try {
		const parsed = new URL(url);
		const rawBitrate = parsed.searchParams.get("bitrate");
		if (rawBitrate && Number.isFinite(Number(rawBitrate))) bitrate = Number(rawBitrate);
		const efg = parsed.searchParams.get("efg");
		if (efg) {
			const json = decodeB64(efg);
			if (json) {
				const meta = JSON.parse(json);
				const heightMatch = String(meta.vencode_tag ?? "").match(/\.(\d{3,4})\./);
				if (heightMatch) height = Number(heightMatch[1]);
				if (typeof meta.duration_s === "number") durationS = meta.duration_s;
			}
		}
	} catch {}
	return {
		height,
		bitrate,
		durationS
	};
}
function listVideoIds(html) {
	const ids = [];
	const seen = /* @__PURE__ */ new Set();
	for (const match of html.matchAll(/"video_id"\s*:\s*"?(\d{8,})/g)) {
		const id = match[1];
		if (!id || seen.has(id)) continue;
		seen.add(id);
		ids.push(id);
	}
	return ids;
}
function nearestOwner(html, index, ids) {
	const window = html.slice(Math.max(0, index - 8e3), index);
	let best = null;
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
function collectVideos(html) {
	const ids = listVideoIds(html);
	const videos = [];
	const seen = /* @__PURE__ */ new Set();
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
				...qualityFromUrl(url, hint)
			});
		}
	}
	return videos;
}
function readDims(url) {
	const match = url.match(/(?:dst-(?:jpg|png|webp)_)?(?:^|[^\d])(?:s|p)(\d{2,5})x(\d{2,5})/i);
	if (!match) return null;
	return {
		width: Number(match[1]),
		height: Number(match[2])
	};
}
function usefulImage(url, trusted) {
	if (!hostOk(url)) return false;
	if (/emoji|static\.xx\.fbcdn\.net|rsrc\.php|safe_image\.php/i.test(url)) return false;
	if (!(/\.(?:jpe?g|png|webp|gif)(?:$|\?)/i.test(url) || /stp=dst-(?:jpg|png|webp)/i.test(url))) return false;
	const dims = readDims(url);
	if (dims && (dims.width < 320 || dims.height < 320)) return false;
	if (!dims && !trusted && /(?:s|p)\d{2,3}x\d{2,3}/i.test(url)) return false;
	return true;
}
function extOf(url, fallback) {
	const match = (pathOf(url) ?? "").match(/\.(mp4|mov|webm|gif|png|webp|jpe?g)$/i);
	if (!match) return fallback;
	const ext = match[1].toLowerCase();
	return ext === "jpeg" ? "jpg" : ext;
}
function collectImages(html) {
	const images = [];
	const seen = /* @__PURE__ */ new Set();
	const push = (raw, trusted) => {
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
			trusted
		});
	};
	push(metaContent(html, "og:image"), true);
	push(metaContent(html, "twitter:image"), true);
	for (const match of html.matchAll(/"(?:uri|url)"\s*:\s*"(https:\/\/[^"\s]+)"/g)) {
		push(match[1] ?? null, false);
		if (images.length >= 24) break;
	}
	return images;
}
function collectFacebook(html) {
	const prepared = preprocess(html);
	const split = splitTitle(metaContent(prepared, "og:title") ?? metaContent(html, "og:title") ?? "Facebook media");
	const durationMatch = prepared.match(/"playable_duration_in_ms"\s*:\s*(\d+)/);
	const unavailable = /content isn't available|content is not available|this content isn't available/i.test(prepared) && !prepared.includes("browser_native_hd_url") && !prepared.includes("browser_native_sd_url") ? "Facebook says this content isn’t available. It may be private, deleted, or limited to certain viewers." : /you must log in to continue|id="login_form"|id="loginbutton"/i.test(prepared) ? "Facebook is asking for a login. This saver only keeps media the public page already includes — it never asks for your password." : null;
	return {
		videos: collectVideos(prepared),
		images: collectImages(prepared),
		title: split.title,
		author: split.author,
		durationMs: durationMatch ? Number(durationMatch[1]) : null,
		unavailable
	};
}
function videoIdFromUrl(input) {
	try {
		const url = new URL(input);
		for (const key of [
			"v",
			"video_id",
			"story_fbid",
			"fbid"
		]) {
			const value = url.searchParams.get(key);
			if (value && /^\d{5,}$/.test(value)) return value;
		}
		const match = url.pathname.match(/\/(?:reel|videos|video|posts|photos|stories)\/(?:[^/]+\/)?(\d{6,})/);
		if (match) return match[1];
		return url.pathname.match(/\/(\d{8,})\/?$/)?.[1] ?? null;
	} catch {
		return null;
	}
}
function inferKind(pageUrl, clips, images) {
	const path = pageUrl.toLowerCase();
	if (path.includes("/stories") || path.includes("story.php") || path.includes("story_fbid")) return "story";
	if (path.includes("/reel/") || path.includes("/share/r/")) return clips > 0 ? "reel" : images > 0 ? "photo" : "reel";
	if (clips === 0 && images > 1) return "album";
	if (clips === 0 && images > 0) return "photo";
	if (path.includes("/photo") || path.includes("fbid=")) return clips > 0 ? "video" : "photo";
	return clips > 0 ? "video" : "post";
}
function labelFor(height, bitrate, index) {
	if (height) return `${height}p`;
	if (bitrate) return `${Math.round(bitrate / 1e3)} kbps`;
	return index === 0 ? "Original" : `Option ${index + 1}`;
}
function focusVideos(videos, pageUrl) {
	if (videos.length === 0) return videos;
	const hinted = videoIdFromUrl(pageUrl);
	if (hinted) {
		const owned = videos.filter((video) => video.ownerId === hinted);
		if (owned.length > 0) return owned;
	}
	const ordered = [...videos].sort((a, b) => a.index - b.index);
	const first = ordered[0];
	if (!first) return [];
	const nearby = new Set(ordered.filter((video) => video.ownerId && video.index <= first.index + 12e4).map((video) => video.ownerId));
	if (nearby.size === 0) return ordered.slice(0, 4);
	return ordered.filter((video) => video.ownerId != null && nearby.has(video.ownerId));
}
function assemble(collected, pageUrl, sizes) {
	const ranked = focusVideos(collected.videos, pageUrl).sort((a, b) => a.index - b.index);
	const groups = /* @__PURE__ */ new Map();
	for (const video of ranked) {
		const key = video.ownerId ?? "one";
		const group = groups.get(key) ?? [];
		group.push(video);
		groups.set(key, group);
	}
	const clips = [...groups.values()].map((group, index) => {
		const byHeight = /* @__PURE__ */ new Map();
		const unknown = [];
		for (const video of group) {
			if (video.height == null) {
				unknown.push(video);
				continue;
			}
			const height = snapHeight(video.height);
			const previous = byHeight.get(height);
			if (!previous || better(video, previous, sizes)) byHeight.set(height, {
				...video,
				height
			});
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
		const variants = chosen.slice(0, 5).map((video, variantIndex) => ({
			label: labelFor(video.height, video.bitrate, variantIndex),
			height: video.height,
			bitrate: video.bitrate,
			bytes: sizes.get(video.url) ?? null,
			ext: extOf(video.url, "mp4"),
			url: video.url
		}));
		return {
			id: `clip-${index + 1}`,
			variants
		};
	}).filter((clip) => clip.variants.length > 0);
	const coverOnly = clips.length > 0;
	const sortedImages = [...collected.images].sort((a, b) => {
		if (a.trusted !== b.trusted) return a.trusted ? -1 : 1;
		return (b.width ?? 0) * (b.height ?? 0) - (a.width ?? 0) * (a.height ?? 0);
	});
	const images = (coverOnly ? sortedImages.slice(0, 1) : sortedImages.slice(0, 18)).map((image) => ({
		url: image.url,
		width: image.width,
		height: image.height,
		ext: extOf(image.url, "jpg")
	}));
	const durationFromVideo = ranked.find((video) => video.durationS)?.durationS;
	return {
		sourceUrl: pageUrl,
		title: collected.title,
		author: collected.author,
		kind: inferKind(pageUrl, clips.length, images.length),
		durationMs: collected.durationMs ?? (durationFromVideo ? Math.round(durationFromVideo * 1e3) : null),
		clips,
		images
	};
}
function better(next, prev, sizes) {
	const nextBytes = sizes.get(next.url) ?? 0;
	const prevBytes = sizes.get(prev.url) ?? 0;
	if (nextBytes !== prevBytes) return nextBytes > prevBytes;
	return (next.bitrate ?? 0) > (prev.bitrate ?? 0);
}
function directMedia(url) {
	if (!hostOk(url)) return null;
	const video = /\.(?:mp4|mov|webm)(?:$|\?)/i.test(url);
	const image = /\.(?:jpe?g|png|webp|gif)(?:$|\?)/i.test(url) || /stp=dst-(?:jpg|png|webp)/i.test(url);
	if (!video && !image) return null;
	if (video) {
		const quality = qualityFromUrl(url, null);
		const variant = {
			label: quality.height ? `${snapHeight(quality.height)}p` : "Original",
			height: quality.height ? snapHeight(quality.height) : null,
			bitrate: quality.bitrate,
			bytes: null,
			ext: extOf(url, "mp4"),
			url
		};
		return {
			sourceUrl: url,
			title: "Facebook video",
			author: null,
			kind: "video",
			durationMs: quality.durationS ? Math.round(quality.durationS * 1e3) : null,
			clips: [{
				id: "clip-1",
				variants: [variant]
			}],
			images: []
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
		images: [{
			url,
			width: dims?.width ?? null,
			height: dims?.height ?? null,
			ext: extOf(url, "jpg")
		}]
	};
}
function candidates(input) {
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
function score(collected) {
	return collected.videos.length * 10 + collected.images.length;
}
async function readPage(url) {
	const response = await fetchChecked(url, "page", {
		headers: pageHeaders(),
		timeoutMs: 12e3
	});
	if (!response.ok) {
		await response.body?.cancel();
		throw new SaveError("Facebook didn’t return that page.", response.status === 404 ? 404 : 502);
	}
	const html = await readHtml(response);
	return {
		finalUrl: response.url || url,
		html
	};
}
async function resolveFacebook(raw) {
	const trimmed = raw.trim();
	if (!trimmed) throw new SaveError("Paste a Facebook link first.");
	let parsed;
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
	if (!isPageHost(parsed.hostname)) throw new SaveError("Paste a public Facebook, fb.watch, or fb.me link.");
	const tries = candidates(parsed.toString()).slice(0, 3);
	let best = null;
	let lastError = null;
	for (const attempt of tries) try {
		const page = await readPage(attempt);
		const collected = collectFacebook(page.html);
		const current = {
			url: page.finalUrl || attempt,
			collected
		};
		if (!best || score(collected) > score(best.collected)) best = current;
		if (collected.videos.length > 0 || collected.images.length > 0) break;
	} catch (error) {
		lastError = error instanceof SaveError ? error : new SaveError("Facebook didn’t respond.", 502);
	}
	if (!best) throw lastError ?? new SaveError("Facebook didn’t return that page.", 502);
	const { collected } = best;
	if (collected.videos.length === 0 && collected.images.length === 0) {
		const story = /\/stories|story_fbid|story\.php/i.test(parsed.toString());
		throw new SaveError(collected.unavailable ?? (story ? "Facebook didn’t include this story on the public page. Stories are usually only visible while signed in, and this saver never takes a password." : "No public video or photo was on that page. It may be private, deleted, or only visible when you’re logged in."), 422);
	}
	const sizes = /* @__PURE__ */ new Map();
	const sample = focusVideos(collected.videos, parsed.toString()).slice(0, 4);
	await Promise.all(sample.map(async (video) => {
		sizes.set(video.url, await probeBytes(video.url));
	}));
	const result = assemble(collected, parsed.toString(), sizes);
	if (result.clips.length === 0 && result.images.length === 0) throw new SaveError("No downloadable file was attached to that public post.", 422);
	return result;
}
var bodySchema = object({ url: string().min(1).max(4e3) });
function json(body, status = 200) {
	return new Response(JSON.stringify(body), {
		status,
		headers: {
			"content-type": "application/json; charset=utf-8",
			"cache-control": "no-store"
		}
	});
}
async function handle({ request }) {
	try {
		let url = "";
		if (request.method === "GET") url = new URL(request.url).searchParams.get("url") ?? "";
		else {
			const parsed = bodySchema.safeParse(await request.json().catch(() => null));
			if (!parsed.success) return json({ error: "Paste a Facebook link first." }, 400);
			url = parsed.data.url;
		}
		return json(await resolveFacebook(url));
	} catch (error) {
		if (error instanceof SaveError) return json({ error: error.message }, error.status);
		console.error("[resolve]", error instanceof Error ? error.name : "error");
		return json({ error: "Couldn’t read that link." }, 500);
	}
}
var Route = createFileRoute("/api/resolve")({ server: { handlers: {
	GET: handle,
	POST: handle
} } });
var rootRouteChildren = {
	IndexRoute: Route$2.update({
		id: "/",
		path: "/",
		getParentRoute: () => Route$3
	}),
	ApiMediaRoute: Route$1.update({
		id: "/api/media",
		path: "/api/media",
		getParentRoute: () => Route$3
	}),
	ApiResolveRoute: Route.update({
		id: "/api/resolve",
		path: "/api/resolve",
		getParentRoute: () => Route$3
	})
};
var routeTree = Route$3._addFileChildren(rootRouteChildren)._addFileTypes();
function getRouter() {
	return createRouter({
		routeTree,
		defaultErrorComponent: AppErrorComponent
	});
}
//#endregion
export { getRouter, router_CxNlqIud_exports as t };
