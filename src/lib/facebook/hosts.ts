const PAGE_HOST =
  /^(?:[a-z0-9-]+\.)*(?:facebook\.com|fb\.com|fb\.watch|fb\.me|fb\.gg)$/i;

const MEDIA_HOST = /^(?:[a-z0-9-]+\.)*(?:fbcdn\.net|fbsbx\.com)$/i;

export function isPageHost(hostname: string): boolean {
  return PAGE_HOST.test(hostname);
}

export function isMediaHost(hostname: string): boolean {
  return MEDIA_HOST.test(hostname);
}

export function assertPublicHttp(url: URL): void {
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Only public http(s) links work.");
  }
  if (url.username || url.password) {
    throw new Error("Links with embedded passwords aren’t accepted.");
  }
  if (url.port && url.port !== "443" && url.port !== "80") {
    throw new Error("That link uses a port this saver won’t open.");
  }
}
