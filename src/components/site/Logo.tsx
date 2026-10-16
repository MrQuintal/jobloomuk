import { Link } from "@tanstack/react-router";
import logoAsset from "@/assets/jobloom-logo.png.asset.json";

export function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <Link to="/" className="group inline-flex items-center gap-2" aria-label="Jobloom home">
      <img src={logoAsset.url} alt="" aria-hidden className="size-8 object-contain" />
      <span className={`font-display text-2xl font-semibold tracking-tight ${inverted ? "text-forest-foreground" : "text-foreground"}`}>
        jobloom
      </span>
    </Link>
  );
}
