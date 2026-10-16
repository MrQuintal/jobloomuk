import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/site/Logo";
import { pageHead } from "@/lib/seo";

type Search = { mode?: "signin" | "signup" | "reset" | undefined; role?: "customer" | "worker" | undefined; next?: string | undefined };

export const Route = createFileRoute("/auth")({
  staticData: { sitemap: false },
  validateSearch: (raw: Record<string, unknown>): Search => {
    const s = raw as { mode?: unknown; role?: unknown; next?: unknown };
    return {
    mode: s.mode === "signup" || s.mode === "reset" ? s.mode : "signin",
    role: s.role === "worker" ? "worker" : s.role === "customer" ? "customer" : undefined,
    next: typeof s.next === "string" && s.next.startsWith("/") && !s.next.startsWith("//") ? s.next : undefined,
    };
  },
  head: () => pageHead("/auth", "Log in or join", "Log in to Jobloom or create a free account as a customer or professional."),
  component: AuthPage,
});

function AuthPage() {
  const { mode = "signin", role: initialRole, next } = Route.useSearch();
  const navigate = useNavigate();
  const { user, ready } = useAuth();
  const [role, setRole] = useState<"customer" | "worker">(initialRole ?? "customer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ready && user && mode !== "reset") navigate({ to: (next as "/dashboard") ?? "/dashboard" });
  }, [ready, user, mode, next, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/dashboard`, data: { display_name: name, signup_role: role } },
        });
        if (error) throw error;
        toast.success("Check your email to confirm your account.");
      } else if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        toast.success("If that email has an account, we've sent a reset link.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (result.error) toast.error(result.error.message);
  }

  const title = mode === "signup" ? "Join Jobloom" : mode === "reset" ? "Reset your password" : "Welcome back";
  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="hidden flex-col justify-between bg-forest p-10 text-forest-foreground md:flex">
        <Logo inverted />
        <p className="font-display text-4xl leading-tight">Good work, found fairly.</p>
        <p className="text-sm text-forest-foreground/60">No commission. No paid-for reviews.</p>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="md:hidden"><Logo /></div>
          <h1 className="mt-8 text-3xl font-medium md:mt-0">{title}</h1>
          {mode === "signup" && (
            <div className="mt-6 grid grid-cols-2 gap-2 rounded-full bg-muted p-1 text-sm">
              {(["customer", "worker"] as const).map((r) => (
                <button key={r} type="button" onClick={() => setRole(r)} className={`rounded-full py-2 transition ${role === r ? "bg-card font-medium shadow-soft" : "text-muted-foreground"}`}>
                  {r === "customer" ? "I need work done" : "I'm a professional"}
                </button>
              ))}
            </div>
          )}
          <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
            {mode === "signup" && (
              <div className="grid gap-1.5"><Label htmlFor="name">Your name</Label><Input id="name" required value={name} onChange={(e) => setName(e.target.value)} /></div>
            )}
            <div className="grid gap-1.5"><Label htmlFor="email">Email</Label><Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            {mode !== "reset" && (
              <div className="grid gap-1.5"><Label htmlFor="password">Password</Label><Input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
            )}
            <Button type="submit" variant="bloom" size="lg" disabled={busy}>
              {busy ? "Please wait…" : mode === "signup" ? "Create account" : mode === "reset" ? "Send reset link" : "Log in"}
            </Button>
          </form>
          {mode !== "reset" && (
            <>
              <div className="my-5 text-center text-xs text-muted-foreground">or</div>
              <Button variant="pill" size="lg" className="w-full" onClick={google}>Continue with Google</Button>
              {mode === "signup" && <p className="mt-2 text-xs text-muted-foreground">With Google, you'll choose customer or professional after signing in.</p>}
            </>
          )}
          <div className="mt-6 flex flex-col gap-2 text-sm text-muted-foreground">
            {mode === "signin" && (
              <>
                <Link to="/auth" search={{ mode: "reset" }} className="hover:text-foreground">Forgot your password?</Link>
                <span>New here? <Link to="/auth" search={{ mode: "signup" }} className="text-foreground underline">Create an account</Link></span>
              </>
            )}
            {mode !== "signin" && <span>Already have an account? <Link to="/auth" search={{ mode: "signin" }} className="text-foreground underline">Log in</Link></span>}
          </div>
        </div>
      </div>
    </div>
  );
}
