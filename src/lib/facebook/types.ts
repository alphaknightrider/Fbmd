export type MediaKind = "video" | "reel" | "photo" | "story" | "album" | "post";

export type Variant = {
  label: string;
  height: number | null;
  bitrate: number | null;
  bytes: number | null;
  ext: string;
  url: string;
};

export type Clip = {
  id: string;
  variants: Variant[];
};

export type ImageItem = {
  url: string;
  width: number | null;
  height: number | null;
  ext: string;
};

export type ResolveOk = {
  sourceUrl: string;
  title: string;
  author: string | null;
  kind: MediaKind;
  durationMs: number | null;
  clips: Clip[];
  images: ImageItem[];
};
