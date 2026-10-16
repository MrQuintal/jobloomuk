import { Input } from "@/components/ui/input";
import { RADIUS_OPTIONS } from "@/lib/rules/distance";

export function DistanceFilter({ place, onPlace, radius, onRadius, found, placeholder }: {
  place: string; onPlace: (v: string) => void; radius: number | null; onRadius: (r: number | null) => void;
  found: boolean | null; placeholder?: string;
}) {
  const pill = (active: boolean) => `rounded-full border px-3 py-1.5 text-sm ${active ? "border-primary bg-primary text-primary-foreground" : "border-border"}`;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input className="max-w-[220px]" placeholder={placeholder ?? "Your postcode or town"} value={place} onChange={(e) => onPlace(e.target.value)} aria-label="Your location" />
      <button type="button" className={pill(radius == null)} onClick={() => onRadius(null)}>Any distance</button>
      {RADIUS_OPTIONS.map((r) => (
        <button key={r} type="button" className={pill(radius === r)} onClick={() => onRadius(r)}>Within {r} miles</button>
      ))}
      {found === false && <span className="text-xs text-destructive">We couldn't find that location</span>}
    </div>
  );
}
