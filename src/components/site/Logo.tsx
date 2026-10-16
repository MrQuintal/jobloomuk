import { Link } from "@tanstack/react-router";

export function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <Link to="/" className="group inline-flex items-center gap-2" aria-label="Jobloom home">
      <svg viewBox="0 0 32 32" className="size-7" aria-hidden>
        <circle cx="16" cy="9" r="6" className="fill-bloom" />
        <circle cx="9" cy="17" r="6" className="fill-bloom opacity-70" />
        <circle cx="23" cy="17" r="6" className="fill-bloom opacity-70" />
        <circle cx="16" cy="16" r="3.2" className={inverted ? "fill-forest-foreground" : "fill-forest"} />
        <path d="M16 19 V30" strokeWidth="2.4" strokeLinecap="round" className={inverted ? "stroke-forest-foreground" : "stroke-forest"} />
      </svg>
      <span className={`font-display text-2xl font-semibold tracking-tight ${inverted ? "text-forest-foreground" : "text-foreground"}`}>
        jobloom
      </span>
    </Link>
  );
}
