import { useQueries, useQuery } from "@tanstack/react-query";
import type { LatLng } from "@/lib/rules/distance";

/** Browser-side UK lookup via postcodes.io: full postcode, outcode, or town name. */
export async function geocodeUK(raw: string): Promise<LatLng | null> {
  const q = raw.trim();
  if (!q) return null;
  const compact = q.replace(/\s+/g, "").toUpperCase();
  const tryJson = async (url: string) => {
    try { const r = await fetch(url); return r.ok ? await r.json() : null; } catch { return null; }
  };
  if (/^[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2}$/.test(compact)) {
    const j = await tryJson(`https://api.postcodes.io/postcodes/${compact}`);
    if (j?.result) return { lat: j.result.latitude, lng: j.result.longitude };
  }
  const out = q.split(/\s+/)[0]!.toUpperCase();
  if (/^[A-Z]{1,2}\d[A-Z\d]?$/.test(out)) {
    const j = await tryJson(`https://api.postcodes.io/outcodes/${out}`);
    if (j?.result?.latitude) return { lat: j.result.latitude, lng: j.result.longitude };
  }
  const town = q.split(",")[0]!.trim();
  const j = await tryJson(`https://api.postcodes.io/places?q=${encodeURIComponent(town)}&limit=1`);
  const p = j?.result?.[0];
  return p ? { lat: p.latitude, lng: p.longitude } : null;
}

const opts = (place: string) => ({
  queryKey: ["geocode", place.trim().toLowerCase()],
  queryFn: () => geocodeUK(place),
  staleTime: Infinity, gcTime: 24 * 3600_000, retry: false,
  enabled: place.trim().length >= 2,
});

export function useGeocode(place: string) { return useQuery(opts(place)); }

/** Returns a map from place text to coordinates (null when not found / still loading). */
export function useGeocodeMany(places: string[]) {
  const uniq = [...new Set(places.filter((p) => p.trim().length >= 2))];
  const res = useQueries({ queries: uniq.map(opts) });
  const map = new Map<string, LatLng | null>();
  uniq.forEach((p, i) => map.set(p, res[i]?.data ?? null));
  return map;
}
