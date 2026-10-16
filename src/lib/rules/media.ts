// Portfolio video links and sponsored placement. Mirrors DB triggers guard_portfolio_video / guard_paid_profile.
export const VIDEO_URL_RE = /^https:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|vimeo\.com\/)/;

export function isValidVideoUrl(url: string) {
  return VIDEO_URL_RE.test(url.trim());
}

/** Turns a YouTube or Vimeo page link into an embeddable player URL, or null if unsupported. */
export function videoEmbedUrl(url: string): string | null {
  const u = url.trim();
  let m = u.match(/youtube\.com\/watch\?v=([\w-]{6,})/) ?? u.match(/youtu\.be\/([\w-]{6,})/);
  if (m) return `https://www.youtube-nocookie.com/embed/${m[1]}`;
  m = u.match(/vimeo\.com\/(\d+)/);
  if (m) return `https://player.vimeo.com/video/${m[1]}`;
  return null;
}

/** At most this many sponsored profiles are lifted to the top of a listing, each labelled "Sponsored". */
export const MAX_SPONSORED_SLOTS = 2;

/** Lifts up to MAX_SPONSORED_SLOTS sponsored profiles to the top; everyone else keeps the fair order. */
export function withSponsored<T extends { is_sponsored: boolean }>(list: T[]): (T & { sponsored: boolean })[] {
  const top = list.filter((p) => p.is_sponsored).slice(0, MAX_SPONSORED_SLOTS);
  const rest = list.filter((p) => !top.includes(p));
  return [...top.map((p) => ({ ...p, sponsored: true })), ...rest.map((p) => ({ ...p, sponsored: false }))];
}
