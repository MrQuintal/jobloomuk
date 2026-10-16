import { pageHead } from "@/lib/seo";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { PageTitle } from "@/components/app/AppShell";
import { RoleGate } from "@/components/app/RoleGate";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useTier } from "./tools";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { canRespondToJob, isValidMessage, type JobStatus } from "@/lib/rules/marketplace";
import { UserAvatar, useAvatars } from "@/components/app/UserAvatar";

function PosterAvatar({ id }: { id: string }) {
  const av = useAvatars([id]);
  return <UserAvatar url={av[id]} name="Customer" className="h-10 w-10 shrink-0" />;
}

export const Route = createFileRoute("/_authenticated/jobs")({
  head: () => {
    const head = pageHead("/jobs", "Find jobs", "Browse open UK customer jobs and manage your professional responses on Jobloom.");
    return { ...head, meta: [...head.meta, { name: "robots", content: "noindex" }] };
  },
  component: () => (
    <RoleGate allow={["worker"]}>
      <JobsPage />
    </RoleGate>
  ),
});

function JobsPage() {
  const { user } = useAuth();
  const uid = user!.id;
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["open-jobs", uid],
    queryFn: async () => {
      const [{ data: jobs }, { data: mine }] = await Promise.all([
        supabase.from("jobs").select("*, categories(name)").eq("status", "open").neq("customer_id", uid).order("created_at", { ascending: false }).limit(100),
        supabase.from("job_responses").select("*").eq("worker_id", uid),
      ]);
      return { jobs: jobs ?? [], mine: mine ?? [] };
    },
  });
  const tier = useTier(uid).data ?? "free";
  const pro = tier !== "free";
  const [flt, setFlt] = useState({ keyword: "", area: "" });
  const searches = useQuery({
    queryKey: ["saved-searches", uid], enabled: pro,
    queryFn: async () => (await supabase.from("saved_searches").select("*").eq("worker_id", uid).order("created_at")).data ?? [],
  });
  const matches = (j: { title: string; description: string; area: string }, f: { keyword?: string | null; area?: string | null }) =>
    (!f.keyword || `${j.title} ${j.description}`.toLowerCase().includes(f.keyword.toLowerCase())) &&
    (!f.area || j.area.toLowerCase().includes(f.area.toLowerCase()));
  const isAlert = (j: { title: string; description: string; area: string; created_at: string }) =>
    (searches.data ?? []).some((s) => new Date(j.created_at) > new Date(s.last_seen_at) && matches(j, s));
  const shown = (q.data?.jobs ?? []).filter((j) => matches(j, flt));

  return (
    <>
      <PageTitle title="Find jobs">Open jobs posted by customers. Show interest with a short message — the customer decides who to talk to.</PageTitle>
      <div className="mb-6 max-w-4xl rounded-2xl border border-border bg-card p-4">
        {pro ? (
          <>
            <div className="flex flex-wrap gap-2">
              <Input className="max-w-xs" placeholder="Keyword, e.g. boiler" value={flt.keyword} onChange={(e) => setFlt({ ...flt, keyword: e.target.value })} />
              <Input className="max-w-xs" placeholder="Area or town" value={flt.area} onChange={(e) => setFlt({ ...flt, area: e.target.value })} />
              <Button size="sm" variant="outline" disabled={!flt.keyword && !flt.area} onClick={async () => {
                const { error } = await supabase.from("saved_searches").insert({ worker_id: uid, name: [flt.keyword, flt.area].filter(Boolean).join(" in "), keyword: flt.keyword || null, area: flt.area || null });
                if (error) { toast.error(error.message); return; }
                toast.success("Search saved — matching new jobs will be flagged"); void searches.refetch();
              }}>Save search</Button>
            </div>
            {(searches.data ?? []).length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <span className="text-muted-foreground">Saved:</span>
                {searches.data!.map((s) => (
                  <span key={s.id} className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1">
                    <button onClick={() => setFlt({ keyword: s.keyword ?? "", area: s.area ?? "" })}>{s.name}</button>
                    <button aria-label="Delete saved search" onClick={async () => { await supabase.from("saved_searches").delete().eq("id", s.id); void searches.refetch(); }}>×</button>
                  </span>
                ))}
                <Button size="sm" variant="ghost" onClick={async () => { await supabase.from("saved_searches").update({ last_seen_at: new Date().toISOString() }).eq("worker_id", uid); void searches.refetch(); }}>Mark alerts seen</Button>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Filters, saved searches and new-job alerts are part of Pro. <Link to="/billing" search={{}} className="underline">See plans</Link></p>
        )}
      </div>
      <div className="grid max-w-4xl gap-4">
        {q.isLoading ? <p className="text-muted-foreground">Loading…</p> : q.data?.jobs.length === 0 ? (
          <p className="text-muted-foreground">No open jobs right now. Make sure your <Link to="/worker" className="underline">profile</Link> is published so customers can find you too.</p>
        ) : shown.map((j) => {
          const resp = q.data!.mine.find((r) => r.job_id === j.id);
          return (
            <article key={j.id} className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-3">
                <PosterAvatar id={j.customer_id} />
                <h2 className="text-xl font-medium">{j.title} {pro && isAlert(j) && <span className="ml-2 rounded-full bg-bloom px-2 py-0.5 align-middle text-xs text-bloom-foreground">New match</span>}</h2>
              </div>
              <p className="text-sm text-muted-foreground">{[j.categories?.name, j.area, j.timing, j.budget_note].filter(Boolean).join(" · ")}</p>
              <p className="mt-3 whitespace-pre-line text-sm">{j.description}</p>
              {resp ? (
                <ResponseState resp={resp} onChange={() => qc.invalidateQueries({ queryKey: ["open-jobs"] })} />
              ) : canRespondToJob({ status: j.status as JobStatus, customer_id: j.customer_id }, uid) ? (
                <Respond jobId={j.id} uid={uid} onDone={() => qc.invalidateQueries({ queryKey: ["open-jobs"] })} />
              ) : null}
            </article>
          );
        })}
      </div>
    </>
  );
}

function ResponseState({ resp, onChange }: { resp: { id: string; status: string }; onChange: () => void }) {
  const label: Record<string, string> = { sent: "You've shown interest", accepted: "The customer wants to talk — check Messages", declined: "The customer chose someone else", withdrawn: "You withdrew" };
  return (
    <div className="mt-4 flex items-center gap-3 text-sm">
      <span className="rounded-full bg-accent px-2.5 py-0.5 text-accent-foreground">{label[resp.status]}</span>
      {resp.status === "sent" && (
        <Button size="sm" variant="ghost" onClick={async () => {
          const { error } = await supabase.from("job_responses").update({ status: "withdrawn" }).eq("id", resp.id);
          if (error) toast.error(error.message);
          onChange();
        }}>Withdraw</Button>
      )}
    </div>
  );
}

function Respond({ jobId, uid, onDone }: { jobId: string; uid: string; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const templates = useQuery({ queryKey: ["templates", uid], enabled: open, queryFn: async () => (await supabase.from("quote_templates").select("id, title, body").eq("worker_id", uid)).data ?? [] });
  if (!open) return <Button className="mt-4" variant="forest" size="sm" onClick={() => setOpen(true)}>I'm interested</Button>;
  return (
    <form className="mt-4" onSubmit={async (e) => {
      e.preventDefault();
      if (!isValidMessage(msg)) return;
      const { error } = await supabase.from("job_responses").insert({ job_id: jobId, worker_id: uid, message: msg.trim() });
      if (error) { toast.error(error.message); return; }
      toast.success("Sent to the customer");
      onDone();
    }}>
      {(templates.data ?? []).length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {templates.data!.map((t) => <Button key={t.id} type="button" size="sm" variant="outline" onClick={() => setMsg(t.body)}>{t.title}</Button>)}
        </div>
      )}
      <Textarea rows={3} maxLength={2000} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Say why you're a good fit and when you could do it." />
      <div className="mt-2 flex gap-2">
        <Button size="sm" type="submit" variant="forest" disabled={!isValidMessage(msg)}>Send</Button>
        <Button size="sm" type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </form>
  );
}
