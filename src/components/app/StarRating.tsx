import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("inline-flex gap-0.5", className)} aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={cn("size-3.5", n <= value ? "fill-gold text-gold" : "text-border")} />
      ))}
    </span>
  );
}

export function StarPicker({ value, onChange, label }: { value: number; onChange: (n: number) => void; label: string }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <span className="inline-flex gap-0.5" role="radiogroup" aria-label={label} onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${n} star${n > 1 ? "s" : ""}`}
          onMouseEnter={() => setHover(n)} onClick={() => onChange(n)} className="p-0.5">
          <Star className={cn("size-5 transition-colors", n <= shown ? "fill-gold text-gold" : "text-border")} />
        </button>
      ))}
    </span>
  );
}

export function RatingBreakdown({ r }: { r: { quality: number; reliability: number; communication: number; value: number } }) {
  const items = [["Quality", r.quality], ["Reliability", r.reliability], ["Communication", r.communication], ["Value", r.value]] as const;
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {items.map(([l, v]) => <span key={l} className="inline-flex items-center gap-1.5">{l} <Stars value={v} /></span>)}
    </div>
  );
}
