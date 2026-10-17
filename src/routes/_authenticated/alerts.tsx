import { pageHead } from "@/lib/seo";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { PageTitle } from "@/components/app/AppShell";
import { RoleGate } from "@/components/app/RoleGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { alertKeyword } from "@/lib/rules/marketplace";
import { useTier } from "./tools";

const MAX_ALERTS = 30;

export const Route = createFileRoute("/_authenticated/alerts")({
  staticData: { sitemap: false },
  head: () => {
    const head = pageHead("/alerts", "Alerts", "Save words and get a Jobloom notification when a new job uses one of them.");
    return { ...head, meta: [...head.meta, { name: "robots", content: "noindex" }] };
  },
  component: () => (
    <RoleGate allow={["worker"]}>
      <Alerts />
    </RoleGate>
  ),
});

function Alerts() {
  const { user } = useAuth();
  const uid = user!.id;
  const qc = useQueryClient();
  const tier = useTier(uid).data ?? "free";
  const pro = tier !== "free";
  const [word, setWord] = useState("");
  const [busy, setBusy] = useState(false);
  const searches = useQuery({
    queryKey: ["saved-searches", uid],
    enabled: pro,
    queryFn: async () => (await supabase.from("saved_searches").select("*").eq("worker_id", uid).order("created_at")).data ?? [],
  });
  const alerts = (searches.data ?? []).filter((s) => s.keyword);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const keyword = alertKeyword(word);
    if (!keyword) { toast.error("Use a word or short phrase, from 2 to 40 characters"); return; }
    if (alerts.some((s) => s.keyword?.toLowerCase() === keyword)) { toast.error("That word is already saved"); return; }
    if (alerts.length >= MAX_ALERTS) { toast.error(`You can save up to ${MAX_ALERTS} words`); return; }
    setBusy(true);
    const { error } = await supabase.from("saved_searches").insert({ worker_id: uid, name: keyword, keyword });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setWord("");
    toast.success("Alert saved");
    void qc.invalidateQueries({ queryKey: ["saved-searches", uid] });
  }

  async function remove(id: string) {
    const { error } = await supabase.from("saved_searches").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    void qc.invalidateQueries({ queryKey: ["saved-searches", uid] });
  }

  return (
    <>
      <PageTitle title="Alerts">Save words from jobs you want. A new job that uses one of them sends you a notification, and that notification opens the post.</PageTitle>
      {!pro ? (
        <p className="max-w-xl text-sm text-muted-foreground">Job alerts are part of Pro. <Link to="/billing" search={{}} className="underline">See plans</Link></p>
      ) : (
        <div className="grid max-w-xl gap-4">
          <form onSubmit={add} className="flex flex-wrap gap-2">
            <Input value={word} onChange={(e) => setWord(e.target.value)} maxLength={40} placeholder="Word or phrase, e.g. boiler" className="max-w-xs" />
            <Button type="submit" variant="forest" disabled={busy}>{busy ? "Saving…" : "Save word"}</Button>
          </form>
          {searches.isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : alerts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No words yet. Add the kinds of work you want to hear about.</p>
          ) : (
            <ul className="grid gap-2">
              {alerts.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm">
                  <span className="font-medium">{s.keyword}</span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => void remove(s.id)}>Remove</Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </>
  );
}
