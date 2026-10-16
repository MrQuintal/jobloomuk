import { useEffect, useState } from "react";

/** Shows the professional's base area on an OpenStreetMap, framed to roughly cover their travel radius. */
export function ServiceAreaMap({ area, radiusMiles }: { area: string; radiusMiles: number }) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let off = false;
    fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=gb&q=${encodeURIComponent(area)}`)
      .then((r) => r.json())
      .then((rows: { lat: string; lon: string }[]) => {
        if (off) return;
        if (!rows[0]) { setFailed(true); return; }
        const lat = Number(rows[0].lat), lon = Number(rows[0].lon);
        const dLat = Math.min(radiusMiles, 100) / 69;
        const dLon = dLat / Math.cos((lat * Math.PI) / 180);
        setSrc(`https://www.openstreetmap.org/export/embed.html?bbox=${lon - dLon},${lat - dLat},${lon + dLon},${lat + dLat}&layer=mapnik&marker=${lat},${lon}`);
      })
      .catch(() => !off && setFailed(true));
    return () => { off = true; };
  }, [area, radiusMiles]);
  if (failed) return null;
  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      {src ? <iframe title={`Map of ${area}`} src={src} className="aspect-square w-full" loading="lazy" /> : <div className="aspect-square w-full bg-secondary" />}
      <p className="bg-card p-3 text-xs text-muted-foreground">Covers about {radiusMiles} miles around {area}. Map © OpenStreetMap contributors.</p>
    </div>
  );
}
