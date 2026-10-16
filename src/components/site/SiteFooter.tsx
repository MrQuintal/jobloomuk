import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";

export function SiteFooter() {
  return (
    <footer className="bg-forest text-forest-foreground">
      <div className="container-page grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo inverted />
          <p className="mt-4 max-w-sm text-sm text-forest-foreground/70">
            A fairer way to find good people for the work you need doing — and for good people to be found. Made in the UK.
          </p>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <span className="eyebrow">Jobloom</span>
          <Link to="/how-it-works" className="hover:underline">How it works</Link>
          <Link to="/about" className="hover:underline">About</Link>
          <Link to="/pricing" className="hover:underline">Pricing</Link>
          <Link to="/contact" className="hover:underline">Contact</Link>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <span className="eyebrow">Legal</span>
          <Link to="/terms" className="hover:underline">Terms of use</Link>
          <Link to="/privacy" className="hover:underline">Privacy notice</Link>
        </div>
      </div>
      <div className="border-t border-forest-foreground/15">
        <p className="container-page py-5 text-xs text-forest-foreground/60">
          © {new Date().getFullYear()} Jobloom · jobloom.co.uk · Jobloom introduces customers and professionals. We never handle job payments or take commission.
        </p>
      </div>
    </footer>
  );
}
