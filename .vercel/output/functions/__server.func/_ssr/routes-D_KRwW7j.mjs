import { i as __toESM } from "../_runtime.mjs";
import { K as require_react, b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as Image, c as Clock3, i as Link2, l as Clapperboard, o as Film, r as LoaderCircle, s as Download, t as X, u as CircleAlert } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-D_KRwW7j.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var RECENT_KEY = "halden.recent";
var KIND_LABEL = {
	video: "Video",
	reel: "Reel",
	photo: "Photo",
	story: "Story",
	album: "Album",
	post: "Post"
};
var HINTS = [
	"facebook.com/reel/…",
	"facebook.com/watch/?v=…",
	"fb.watch/…",
	"facebook.com/photo/?fbid=…",
	"facebook.com/stories/…"
];
function extractCandidate(text) {
	return (text.match(/https?:\/\/[^\s]+/i)?.[0] ?? text).trim().replace(/[),.\]]+$/, "");
}
function formatBytes(bytes) {
	if (!bytes || bytes < 1) return null;
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1048576) return `${Math.round(bytes / 1024)} KB`;
	return `${(bytes / 1048576).toFixed(bytes >= 10485760 ? 0 : 1)} MB`;
}
function formatRate(bitrate) {
	if (!bitrate) return null;
	if (bitrate >= 1e6) return `${(bitrate / 1e6).toFixed(1)} Mbps`;
	return `${Math.round(bitrate / 1e3)} kbps`;
}
function formatDuration(ms) {
	if (!ms || ms < 500) return null;
	const total = Math.round(ms / 1e3);
	const minutes = Math.floor(total / 60);
	const seconds = total % 60;
	return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
function slug(value) {
	return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "facebook-media";
}
function fileHref(url, name, inline = false) {
	const params = new URLSearchParams({
		src: url,
		name
	});
	if (inline) params.set("inline", "1");
	return `/api/media?${params.toString()}`;
}
function variantName(title, variant, index) {
	return `${slug(title)}-${variant.label.replace(/\s+/g, "").toLowerCase() || index + 1}.${variant.ext}`;
}
function imageName(title, image, index) {
	return `${slug(title)}-${index + 1}.${image.ext}`;
}
function readRecent() {
	try {
		const parsed = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
		if (!Array.isArray(parsed)) return [];
		return parsed.filter((item) => item && typeof item.url === "string" && typeof item.title === "string").slice(0, 6);
	} catch {
		return [];
	}
}
function pushRecent(item) {
	const next = [item, ...readRecent().filter((entry) => entry.url !== item.url)].slice(0, 6);
	localStorage.setItem(RECENT_KEY, JSON.stringify(next));
	return next;
}
function Saver() {
	const [url, setUrl] = (0, import_react.useState)("");
	const [loading, setLoading] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const [result, setResult] = (0, import_react.useState)(null);
	const [recent, setRecent] = (0, import_react.useState)([]);
	(0, import_react.useEffect)(() => {
		setRecent(readRecent());
	}, []);
	async function resolve(raw) {
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
				body: JSON.stringify({ url: nextUrl })
			});
			const data = await response.json();
			if (!response.ok) throw new Error(data.error || "Couldn’t read that link.");
			setResult(data);
			setRecent(pushRecent({
				url: nextUrl,
				title: data.title,
				kind: data.kind,
				at: Date.now()
			}));
		} catch (err) {
			setResult(null);
			setError(err instanceof Error ? err.message : "Couldn’t read that link.");
		} finally {
			setLoading(false);
		}
	}
	const duration = formatDuration(result?.durationMs ?? null);
	const best = result?.clips[0]?.variants[0];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-8 sm:px-6 sm:py-14",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex items-center justify-between gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "flex size-11 items-center justify-center rounded-xl bg-primary text-primary-fg",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, {
							className: "size-5",
							"aria-hidden": "true"
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-xl leading-none font-semibold tracking-tight",
						children: "Halden"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted",
						children: "Public Facebook saver"
					})] })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "hidden text-sm text-faint sm:block",
					children: "No login · no password"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-10 sm:mt-14",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "font-display text-4xl leading-tight font-semibold tracking-tight text-balance sm:text-5xl",
						children: "Save the video, reel, or photo behind a public link."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-4 max-w-2xl text-base text-muted sm:text-lg",
						children: "Paste a Facebook, fb.watch, or fb.me address. Halden reads the public page and gives you the real file — highest quality first."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						className: "mt-8 flex flex-col gap-3 sm:flex-row",
						onSubmit: (event) => {
							event.preventDefault();
							resolve(url);
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "sr-only",
								htmlFor: "facebook-url",
								children: "Facebook link"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative min-w-0 flex-1",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link2, { className: "pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-faint" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										id: "facebook-url",
										value: url,
										onChange: (event) => setUrl(event.target.value),
										placeholder: "Paste a public Facebook link",
										inputMode: "url",
										autoCapitalize: "off",
										autoCorrect: "off",
										spellCheck: false,
										className: "h-12 w-full rounded-xl border border-border bg-surface pr-12 pl-11 text-base text-fg outline-none placeholder:text-faint focus-visible:border-primary"
									}),
									url ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg",
										onClick: () => {
											setUrl("");
											setError(null);
										},
										"aria-label": "Clear link",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
									}) : null
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "submit",
								disabled: loading,
								className: "inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-base font-medium text-primary-fg transition-opacity duration-200 hover:opacity-90 disabled:opacity-60",
								children: [loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-5 animate-spin motion-reduce:animate-none" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-5" }), loading ? "Reading" : "Fetch media"]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-4 flex flex-wrap gap-2",
						children: HINTS.map((hint) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
							className: "rounded-full border border-border px-3 py-1 text-xs text-faint",
							children: hint
						}, hint))
					}),
					error ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						role: "alert",
						className: "mt-4 flex items-start gap-2 text-sm text-fg",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, {
							className: "mt-0.5 size-4 shrink-0 text-primary",
							"aria-hidden": "true"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: error })]
					}) : null
				]
			}),
			loading && !result ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-10 text-sm text-muted",
				children: "Opening the public page and picking the best file…"
			}) : null,
			result ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rise mt-10 rounded-lg border border-border bg-surface p-4 sm:p-5",
				"aria-live": "polite",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center gap-2 text-sm text-muted",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 text-fg",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KindIcon, { kind: result.kind }), KIND_LABEL[result.kind]]
							}),
							duration ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "inline-flex items-center gap-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock3, {
									className: "size-4",
									"aria-hidden": "true"
								}), duration]
							}) : null,
							result.author ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-muted",
								children: result.author
							}) : null
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mt-3 font-display text-2xl leading-snug font-semibold text-balance",
						children: result.title
					}),
					best ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
						className: "mt-4 max-h-player w-full rounded-xl bg-bg",
						controls: true,
						playsInline: true,
						preload: "metadata",
						poster: result.images[0] ? fileHref(result.images[0].url, "cover.jpg", true) : void 0,
						src: fileHref(best.url, variantName(result.title, best, 0), true)
					}, best.url) : null,
					result.clips.map((clip, clipIndex) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: clipIndex === 0 ? "mt-4" : "mt-6",
						children: [result.clips.length > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
							className: "mb-2 text-sm font-medium text-muted",
							children: ["Clip ", clipIndex + 1]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "mb-2 text-sm font-medium text-muted",
							children: "Qualities"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "divide-y divide-border overflow-hidden rounded-xl border border-border",
							children: clip.variants.map((variant, index) => {
								const name = variantName(result.title, variant, index);
								const size = formatBytes(variant.bytes);
								const rate = formatRate(variant.bitrate);
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
									className: "flex items-center justify-between gap-3 bg-bg px-3 py-2.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "min-w-0",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "font-medium",
											children: variant.label
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-sm text-muted",
											children: [
												size,
												rate,
												variant.ext.toUpperCase()
											].filter(Boolean).join(" · ")
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
										href: fileHref(variant.url, name),
										className: index === 0 && clipIndex === 0 ? "inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-primary px-3 text-sm font-medium text-primary-fg" : "inline-flex h-11 shrink-0 items-center gap-2 rounded-xl border border-border px-3 text-sm font-medium text-fg",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, {
											className: "size-4",
											"aria-hidden": "true"
										}), "Save"]
									})]
								}, variant.url);
							})
						})]
					}, clip.id)),
					result.images.length > 0 && result.clips.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
						href: fileHref(result.images[0].url, imageName(result.title, result.images[0], 0)),
						className: "mt-4 inline-flex h-11 items-center gap-2 text-sm font-medium text-muted hover:text-fg",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Image, {
							className: "size-4",
							"aria-hidden": "true"
						}), "Save cover image"]
					}) : null,
					result.images.length > 0 && result.clips.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-6",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-2 flex items-center justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "text-sm font-medium text-muted",
								children: result.images.length > 1 ? "Photos" : "Photo"
							}), result.images.length > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "inline-flex h-11 items-center gap-2 rounded-xl border border-border px-3 text-sm font-medium",
								onClick: () => {
									result.images.forEach((image, index) => {
										const anchor = document.createElement("a");
										anchor.href = fileHref(image.url, imageName(result.title, image, index));
										anchor.rel = "noopener";
										document.body.appendChild(anchor);
										anchor.click();
										anchor.remove();
									});
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, {
									className: "size-4",
									"aria-hidden": "true"
								}), "Save all"]
							}) : null]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "grid grid-cols-2 gap-3 sm:grid-cols-3",
							children: result.images.map((image, index) => {
								const name = imageName(result.title, image, index);
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
									className: "overflow-hidden rounded-xl border border-border bg-bg",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
										src: fileHref(image.url, name, true),
										alt: "",
										className: "aspect-square w-full object-cover"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
										href: fileHref(image.url, name),
										className: "flex h-11 items-center justify-center gap-2 text-sm font-medium text-fg",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, {
											className: "size-4",
											"aria-hidden": "true"
										}), "Save"]
									})]
								}, image.url);
							})
						})]
					}) : null
				]
			}) : null,
			recent.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-10",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-sm font-medium text-muted",
					children: "Recent"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border",
					children: recent.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-surface",
						onClick: () => void resolve(item.url),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KindIcon, { kind: item.kind }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "min-w-0 flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block truncate font-medium",
								children: item.title
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block truncate text-sm text-faint",
								children: item.url
							})]
						})]
					}) }, item.url))
				})]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("footer", {
				className: "mt-auto pt-12 text-sm text-faint",
				children: "Halden only saves media Facebook already serves on a public link. Private posts and most stories stay locked, and it will not ask for your Facebook password. Keep copies only when you have the right to."
			})
		]
	});
}
function KindIcon({ kind }) {
	const className = "size-4 shrink-0 text-primary";
	if (kind === "photo" || kind === "album") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Image, {
		className,
		"aria-hidden": "true"
	});
	if (kind === "reel" || kind === "story") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clapperboard, {
		className,
		"aria-hidden": "true"
	});
	if (kind === "video") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Film, {
		className,
		"aria-hidden": "true"
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link2, {
		className,
		"aria-hidden": "true"
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Saver, {});
}
//#endregion
export { Home as component };
