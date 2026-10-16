import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { Logo } from "./Logo";

const NAV = [
  { to: "/professionals", label: "Find professionals" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/for-customers", label: "For customers" },
  { to: "/for-professionals", label: "For professionals" },
  { to: "/pricing", label: "Pricing" },
] as const;

export function SiteHeader() {
  const { user, ready } = useAuth();
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-6">
        <Logo />
        <nav className="hidden items-center gap-7 md:flex">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} className="text-sm text-muted-foreground transition-colors hover:text-foreground" activeProps={{ className: "text-foreground font-medium" }}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          {ready && user ? (
            <Button asChild variant="forest"><Link to="/dashboard">My dashboard</Link></Button>
          ) : (
            <>
              <Button asChild variant="ghost"><Link to="/auth" search={{ mode: "signin" }}>Log in</Link></Button>
              <Button asChild variant="bloom"><Link to="/auth" search={{ mode: "signup" }}>Join Jobloom</Link></Button>
            </>
          )}
        </div>
        <button className="md:hidden" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen(!open)}>
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <nav className="container-page flex flex-col gap-1 py-4">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="rounded-md px-2 py-2.5 text-base">
                {n.label}
              </Link>
            ))}
            <div className="mt-3 flex gap-2">
              {user ? (
                <Button asChild variant="forest" className="flex-1"><Link to="/dashboard">My dashboard</Link></Button>
              ) : (
                <>
                  <Button asChild variant="pill" className="flex-1"><Link to="/auth" search={{ mode: "signin" }}>Log in</Link></Button>
                  <Button asChild variant="bloom" className="flex-1"><Link to="/auth" search={{ mode: "signup" }}>Join</Link></Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
