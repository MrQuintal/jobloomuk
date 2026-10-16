export type LatLng = { lat: number; lng: number };

/** Straight-line distance in miles (haversine). */
export function milesBetween(a: LatLng, b: LatLng): number {
  const R = 3958.8;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** null radius = any distance. Unknown distance only passes "any". */
export function withinRadius(miles: number | null, radius: number | null): boolean {
  if (radius == null) return true;
  return miles != null && miles <= radius;
}

export function formatMiles(miles: number): string {
  return miles < 1 ? "Under 1 mile away" : `${miles.toFixed(1)} miles away`;
}

export const RADIUS_OPTIONS = [5, 10, 25, 50] as const;
