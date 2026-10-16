import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ClipboardList, Hammer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { PageTitle } from "@/components/app/AppShell";
import type { AppRole } from "@/lib/rules/roles";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Choose your account type | Jobloom" }, { name: "robots", content: "noindex" }] }),
  component: Onboarding,
});

function Onboarding() {
  const { refreshRoles } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  async function choose(role: AppRole) {
    setBusy(true);
    const { error } = await supabase.rpc("choose_initial_role", { _role: role });
    setBusy(false);
    if (error) return toast.error(error.message);
    await refreshRoles();
    navigate({ to: role === "worker" ? "/worker" : "/customer" });
  }

  const options = [
    { role: "customer" as const, icon: ClipboardList, title: "I need work done", body: "Post jobs and find professionals." },
    { role: "worker" as const, icon: Hammer, title: "I'm a professional", body: "Showcase your work and find jobs." },
  ];
  return (
    <div className="max-w-3xl">
      <PageTitle title="How will you use Jobloom?">You can only choose this once. Contact support if you need to change it later.</PageTitle>
      <div className="grid gap-4 sm:grid-cols-2">
        {options.map((o) => (
          <button key={o.role} disabled={busy} onClick={() => choose(o.role)} className="rounded-3xl border border-border bg-card p-7 text-left transition hover:border-bloom hover:shadow-soft disabled:opacity-50">
            <o.icon className="size-6 text-bloom" />
            <h2 className="mt-4 text-xl font-medium">{o.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{o.body}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
