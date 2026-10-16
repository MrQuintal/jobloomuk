import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { PageTitle } from "@/components/app/AppShell";
import { RoleGate } from "@/components/app/RoleGate";
import { supabase } from "@/integrations/supabase/client";
import { slugify } from "@/lib/rules/marketplace";
import { PricingTipsEditor } from "@/components/app/PricingGuidance";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  head: () => {
    const head = pageHead("/admin/settings", "Admin settings", "Manage Jobloom categories, pricing tips, feature switches and account overview.");
    return { ...head, meta: [...head.meta, { name: "robots", content: "noindex" }] };
  },
  component: () => <RoleGate allow={["admin", "super_admin"]}><Settings /></RoleGate>,
});

function Settings() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const [{ data: cats }, { data: flags }, { data: stats }] = await Promise.all([
        supabase.from("categories").select("*").order("sort_order"),
        supabase.from("feature_flags").select("*").order("key"),
        Promise.all([
          supabase.from("profiles").select("id", { count: "exact", head: true }),
          supabase.from("jobs").select("id", { count: "exact", head: true }),
          supabase.from("worker_profiles").select("user_id", { count: "exact", head: true }).eq("is_published", true),
          supabase.from("reports").select("id", { count: "exact", head: true }).eq("status", "open"),
        ]).then((r) => ({ data: r.map((x) => x.count ?? 0) })),
      ]);
      return { cats: cats ?? [], flags: flags ?? [], stats: stats ?? [0, 0, 0, 0] };
    },
  });
  const [name, setName] = useState("");
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-settings"] });

  return (
    <>
      <PageTitle title="Overview & settings">Live numbers, trade categories and feature switches.</PageTitle>
      {q.data && (
        <div className="grid max-w-3xl gap-10">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {["Accounts", "Jobs posted", "Live profiles", "Open reports"].map((l, i) => (
              <div key={l} className="rounded-xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">{l}</p><p className="text-2xl font-medium">{q.data.stats[i]}</p></div>
            ))}
          </div>
          <section>
            <h2 className="text-xl font-medium">Categories</h2>
            <ul className="mt-3 divide-y divide-border rounded-xl border border-border bg-card">
              {q.data.cats.map((c) => (
                <li key={c.id} className="flex items-center justify-between p-3 text-sm">
                  <span>{c.name}</span>
                  <Switch checked={c.is_active} onCheckedChange={async (v) => { await supabase.from("categories").update({ is_active: v }).eq("id", c.id); refresh(); }} />
                </li>
              ))}
            </ul>
            <form className="mt-3 flex gap-2" onSubmit={async (e) => {
              e.preventDefault();
              const { error } = await supabase.from("categories").insert({ name: name.trim(), slug: slugify(name), sort_order: q.data.cats.length + 1 });
              if (error) toast.error(error.message); else { setName(""); refresh(); }
            }}>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="New category" />
              <Button type="submit" variant="outline" disabled={!name.trim()}>Add</Button>
            </form>
          </section>
          <PricingTipsEditor categories={q.data.cats} />
          <section>
            <h2 className="text-xl font-medium">Feature switches</h2>
            {q.data.flags.length === 0 && <p className="mt-2 text-muted-foreground">No switches defined.</p>}
            <ul className="mt-3 divide-y divide-border rounded-xl border border-border bg-card">
              {q.data.flags.map((f) => (
                <li key={f.key} className="flex items-center justify-between gap-4 p-3 text-sm">
                  <span><span className="font-medium">{f.key}</span>{f.description && <span className="block text-xs text-muted-foreground">{f.description}</span>}</span>
                  <Switch checked={f.enabled} onCheckedChange={async (v) => { await supabase.from("feature_flags").update({ enabled: v }).eq("key", f.key); refresh(); }} />
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </>
  );
}
