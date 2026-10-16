import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { PageTitle } from "@/components/app/AppShell";
import { RoleGate } from "@/components/app/RoleGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import type { JobStatus } from "@/lib/rules/marketplace";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/customer")({
  head: () => {
    const head = pageHead("/customer", "My jobs", "Manage your Jobloom job posts and responses from independent UK professionals.");
    return { ...head, meta: [...head.meta, { name: "robots", content: "noindex" }] };
  },
  component: () => (
    <RoleGate allow={["customer"]}>
      <CustomerPage />
    </RoleGate>
  ),
});

const STATUS_LABEL: Record<JobStatus, string> = { open: "Open", paused: "Paused", closed: "Closed" };

function CustomerPage() {
  const { user } = useAuth();
  const uid = user!.id;
  const qc = useQueryClient();
  const navigate = useNavigate();
  const jobs = useQuery({
    queryKey: ["my-jobs", uid],
    queryFn: async () => {
      const { data: js } = await supabase.from("jobs").select("*, categories(name)").eq("customer_id", uid).order("created_at", { ascending: false });
      const ids = (js ?? []).map((j) => j.id);
      const { data: rs } = ids.length ? await supabase.from("job_responses").select("*").in("job_id", ids).order("created_at") : { data: [] };
      const wids = [...new Set((rs ?? []).map((r) => r.worker_id))];
      const { data: ws } = wids.length ? await supabase.from("worker_profiles").select("user_id, business_name, slug").in("user_id", wids) : { data: [] };
      return { jobs: js ?? [], responses: rs ?? [], workers: ws ?? [] };
    },
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["my-jobs"] });

  async function setStatus(id: string, status: JobStatus) {
    const { error } = await supabase.from("jobs").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    refresh();
  }
  async function accept(responseId: string) {
    const { data, error } = await supabase.rpc("accept_job_response", { _response_id: responseId });
    if (error) { toast.error(error.message); return; }
    navigate({ to: "/messages/$id", params: { id: data } });
  }
  async function decline(responseId: string) {
    const { error } = await supabase.rpc("decline_job_response", { _response_id: responseId });
    if (error) toast.error(error.message);
    refresh();
  }

  return (
    <>
      <PageTitle title="My jobs">Post the work you need done. Interested professionals will respond, and you choose who to talk to.</PageTitle>
      <p className="mb-6 max-w-4xl text-sm text-muted-foreground">Jobloom does not vet professionals or verify credentials. Before agreeing to work, ask for suitable insurance and qualifications, check any required trade registration with the relevant register, and agree the scope and price in writing.</p>
      <div className="grid max-w-4xl gap-6">
        <PostJob uid={uid} onDone={refresh} />
        {jobs.isLoading ? <p className="text-muted-foreground">Loading…</p> : jobs.data?.jobs.length === 0 ? (
          <p className="text-muted-foreground">You haven't posted any jobs yet. You can also <Link to="/professionals" search={{}} className="underline">browse professionals</Link> and message one directly.</p>
        ) : jobs.data?.jobs.map((j) => {
          const rs = jobs.data.responses.filter((r) => r.job_id === j.id && r.status !== "withdrawn");
          return (
            <article key={j.id} className="rounded-2xl border border-border bg-card p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-medium">{j.title}</h2>
                  <p className="text-sm text-muted-foreground">{[j.categories?.name, j.area, j.timing].filter(Boolean).join(" · ")}</p>
                </div>
                <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs text-accent-foreground">{STATUS_LABEL[j.status as JobStatus]}</span>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm">{j.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {j.status === "open" && <Button size="sm" variant="outline" onClick={() => setStatus(j.id, "paused")}>Pause</Button>}
                {j.status === "paused" && <Button size="sm" variant="outline" onClick={() => setStatus(j.id, "open")}>Reopen</Button>}
                {j.status !== "closed" && <Button size="sm" variant="outline" onClick={() => setStatus(j.id, "closed")}>Close job</Button>}
              </div>
              <h3 className="mt-6 font-medium">Responses ({rs.length})</h3>
              {rs.length === 0 ? <p className="mt-1 text-sm text-muted-foreground">No responses yet.</p> : (
                <ul className="mt-2 grid gap-3">
                  {rs.map((r) => {
                    const w = jobs.data.workers.find((x) => x.user_id === r.worker_id);
                    return (
                      <li key={r.id} className="rounded-xl border border-border p-4">
                        <p className="text-sm font-medium">{w ? <Link to="/pro/$slug" params={{ slug: w.slug }} className="underline">{w.business_name}</Link> : "A professional"}</p>
                        <p className="mt-1 whitespace-pre-line text-sm">{r.message}</p>
                        <div className="mt-3 flex gap-2">
                          {r.status === "sent" && <><Button size="sm" variant="forest" onClick={() => accept(r.id)}>Talk to them</Button><Button size="sm" variant="ghost" onClick={() => decline(r.id)}>Decline</Button></>}
                          {r.status === "accepted" && <Button size="sm" variant="outline" onClick={() => accept(r.id)}>Open conversation</Button>}
                          {r.status === "declined" && <span className="text-xs text-muted-foreground">Declined</span>}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </article>
          );
        })}
      </div>
    </>
  );
}

function PostJob({ uid, onDone }: { uid: string; onDone: () => void }) {
  const cats = useQuery({ queryKey: ["cats-client"], queryFn: async () => (await supabase.from("categories").select("id, name").eq("is_active", true).order("sort_order")).data ?? [] });
  const empty = { title: "", description: "", category_id: "", area: "", timing: "", budget_note: "" };
  const [f, setF] = useState(empty);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  if (!open) return <Button variant="bloom" className="w-fit" onClick={() => setOpen(true)}>Post a job</Button>;
  return (
    <form
      className="rounded-2xl border border-border bg-card p-6"
      onSubmit={async (e) => {
        e.preventDefault();
        if (f.title.trim().length < 5 || f.description.trim().length < 20 || f.area.trim().length < 2) { toast.error("Add a title, a description of at least 20 characters and your area"); return; }
        setBusy(true);
        const { error } = await supabase.from("jobs").insert({
          customer_id: uid, title: f.title.trim(), description: f.description.trim(), area: f.area.trim(),
          category_id: f.category_id || null, timing: f.timing.trim() || null, budget_note: f.budget_note.trim() || null,
        });
        setBusy(false);
        if (error) { toast.error(error.message); return; }
        toast.success("Job posted");
        setF(empty);
        setOpen(false);
        onDone();
      }}
    >
      <h2 className="text-xl font-medium">Post a job</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2"><Label>What do you need done?</Label><Input value={f.title} onChange={set("title")} maxLength={120} placeholder="e.g. Replace a leaking kitchen tap" /></div>
        <div className="md:col-span-2"><Label>Details</Label><Textarea rows={4} value={f.description} onChange={set("description")} maxLength={4000} /></div>
        <div><Label>Type of work</Label>
          <select className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" value={f.category_id} onChange={set("category_id")}>
            <option value="">Not sure</option>
            {(cats.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div><Label>Area (town or postcode district)</Label><Input value={f.area} onChange={set("area")} maxLength={80} placeholder="e.g. LS6" /></div>
        <div><Label>When</Label><Input value={f.timing} onChange={set("timing")} maxLength={80} placeholder="e.g. Within 2 weeks" /></div>
        <div><Label>Budget guide (optional)</Label><Input value={f.budget_note} onChange={set("budget_note")} maxLength={80} /></div>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">Don't include your full address or phone number. You agree price and payment directly with the professional — Jobloom never takes payment.</p>
      <div className="mt-4 flex gap-2">
        <Button type="submit" variant="forest" disabled={busy}>Post job</Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </form>
  );
}
