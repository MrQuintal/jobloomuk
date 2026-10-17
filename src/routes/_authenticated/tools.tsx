import { pageHead } from "@/lib/seo";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Trash2, Sparkles, Lock } from "lucide-react";
import { PageTitle } from "@/components/app/AppShell";
import { RoleGate } from "@/components/app/RoleGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { aiWrite } from "@/lib/ai.functions";
import { conversionRate, LEAD_STAGES, tierAtLeast, type PlanTier } from "@/lib/rules/plans";
import defaultBanner from "@/assets/default-profile-banner.png";
import { BannerCropper } from "@/components/app/BannerCropper";

export const Route = createFileRoute("/_authenticated/tools")({
  staticData: { sitemap: false },
  head: () => {
    const head = pageHead("/tools", "Pro tools", "Manage your Jobloom professional analytics, saved searches and business tools.");
    return { ...head, meta: [...head.meta, { name: "robots", content: "noindex" }] };
  },
  component: () => (
    <RoleGate allow={["worker"]}>
      <Tools />
    </RoleGate>
  ),
});

const card = "rounded-2xl border border-border bg-card p-6";

export function useTier(uid: string) {
  return useQuery({
    queryKey: ["tier", uid],
    refetchInterval: 15000,
    queryFn: async () => ((await supabase.rpc("plan_tier", { _u: uid })).data ?? "free") as PlanTier,
  });
}

function Locked({ need }: { need: "pro" | "business" }) {
  return (
    <p className="flex items-center gap-2 text-sm text-muted-foreground">
      <Lock className="size-4" /> Part of {need === "pro" ? "Pro" : "Business"}. <Link to="/billing" search={{}} className="underline">See plans</Link>
    </p>
  );
}

function Section({ title, need, tier, children }: { title: string; need: "pro" | "business"; tier: PlanTier; children: ReactNode }) {
  return (
    <section className={card}>
      <h2 className="mb-4 text-xl font-medium">{title}</h2>
      {tierAtLeast(tier, need) ? children : <Locked need={need} />}
    </section>
  );
}

function Tools() {
  const { user } = useAuth();
  const uid = user!.id;
  const t = useTier(uid);
  if (t.isLoading) return <p className="text-muted-foreground">Loading…</p>;
  const tier = t.data ?? "free";
  return (
    <>
      <PageTitle title="Pro tools">You're on the <span className="capitalize">{tier}</span> plan. Paying never buys reviews, badges or guaranteed jobs.</PageTitle>
      <div className="grid max-w-4xl gap-6">
        <Section title="Profile analytics (last 30 days)" need="pro" tier={tier}><Analytics uid={uid} /></Section>
        <Section title="Banner & sponsored placement" need="pro" tier={tier}><Branding uid={uid} /></Section>
        <Section title="Instant job alerts" need="pro" tier={tier}>
          <p className="text-sm text-muted-foreground">Save a search on <Link to="/jobs" className="underline">Find jobs</Link> and you'll get a notification the moment a matching job is posted. Email alerts are coming once Jobloom's email address is set up.</p>
        </Section>
        <Section title="AI writing help" need="pro" tier={tier}><AiHelper /></Section>
        <Section title="Quote templates" need="pro" tier={tier}><Templates uid={uid} /></Section>
        <Section title="Lead pipeline" need="business" tier={tier}><Pipeline uid={uid} /></Section>
        <Section title="Team members" need="business" tier={tier}><Team uid={uid} /></Section>
        <Section title="Branches" need="business" tier={tier}><Branches uid={uid} /></Section>
        <Section title="Team calendar" need="business" tier={tier}><Calendar uid={uid} /></Section>
      </div>
    </>
  );
}

function Analytics({ uid }: { uid: string }) {
  const q = useQuery({
    queryKey: ["analytics", uid],
    queryFn: async () => {
      const since = new Date(Date.now() - 30 * 864e5).toISOString();
      const { data } = await supabase.from("profile_events").select("kind").eq("worker_id", uid).gte("created_at", since);
      const views = data?.filter((e) => e.kind === "view").length ?? 0;
      const enquiries = data?.filter((e) => e.kind === "enquiry").length ?? 0;
      return { views, enquiries };
    },
  });
  const d = q.data ?? { views: 0, enquiries: 0 };
  return (
    <div className="grid grid-cols-3 gap-4 text-center">
      {[["Profile views", d.views], ["Enquiries", d.enquiries], ["Conversion", `${conversionRate(d.views, d.enquiries)}%`]].map(([l, v]) => (
        <div key={l} className="rounded-xl bg-secondary p-4"><p className="font-display text-3xl">{v}</p><p className="text-sm text-muted-foreground">{l}</p></div>
      ))}
    </div>
  );
}

function AiHelper() {
  const [kind, setKind] = useState<"bio" | "headline" | "reply" | "quote">("bio");
  const [text, setText] = useState("");
  const [out, setOut] = useState("");
  const [busy, setBusy] = useState(false);
  const labels = { bio: "Profile description", headline: "Headline", reply: "Reply to a job", quote: "Quote message" };
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-2">
        {(Object.keys(labels) as (keyof typeof labels)[]).map((k) => (
          <Button key={k} size="sm" variant={kind === k ? "default" : "outline"} onClick={() => setKind(k)}>{labels[k]}</Button>
        ))}
      </div>
      <Textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste your draft or a few notes…" />
      <Button disabled={busy || text.trim().length < 3} onClick={async () => {
        setBusy(true);
        const r = await aiWrite({ data: { kind, text } }).catch(() => ({ error: "AI writing failed" }));
        setBusy(false);
        if ("error" in r) { toast.error(r.error); return; }
        setOut(r.text);
      }}><Sparkles /> {busy ? "Writing…" : "Write it for me"}</Button>
      {out && (
        <div className="rounded-xl bg-secondary p-4 text-sm">
          <p className="whitespace-pre-line">{out}</p>
          <Button size="sm" variant="ghost" className="mt-2" onClick={() => { void navigator.clipboard.writeText(out); toast.success("Copied"); }}>Copy</Button>
          <p className="mt-1 text-xs text-muted-foreground">Check it before using — AI can make mistakes.</p>
        </div>
      )}
    </div>
  );
}

function Templates({ uid }: { uid: string }) {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["templates", uid], queryFn: async () => (await supabase.from("quote_templates").select("*").eq("worker_id", uid).order("created_at")).data ?? [] });
  const [f, setF] = useState({ title: "", body: "" });
  return (
    <div className="grid gap-3">
      {q.data?.map((t) => (
        <div key={t.id} className="flex items-start justify-between gap-3 rounded-xl bg-secondary p-4 text-sm">
          <div><p className="font-medium">{t.title}</p><p className="whitespace-pre-line text-muted-foreground">{t.body}</p></div>
          <Button size="icon" variant="ghost" aria-label="Delete template" onClick={async () => { await supabase.from("quote_templates").delete().eq("id", t.id); void qc.invalidateQueries({ queryKey: ["templates"] }); }}><Trash2 /></Button>
        </div>
      ))}
      <Input placeholder="Template name, e.g. Bathroom refit intro" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
      <Textarea rows={3} placeholder="Template text" value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} />
      <Button disabled={!f.title.trim() || !f.body.trim()} onClick={async () => {
        const { error } = await supabase.from("quote_templates").insert({ worker_id: uid, title: f.title.trim(), body: f.body.trim() });
        if (error) { toast.error(error.message); return; }
        setF({ title: "", body: "" }); void qc.invalidateQueries({ queryKey: ["templates"] });
      }}>Save template</Button>
      <p className="text-xs text-muted-foreground">Templates appear when you respond to a job.</p>
    </div>
  );
}

function Pipeline({ uid }: { uid: string }) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["pipeline", uid],
    queryFn: async () => {
      const [{ data: convs }, { data: stages }, { data: team }] = await Promise.all([
        supabase.from("conversations").select("id, created_at, jobs(title)").eq("worker_id", uid).order("last_message_at", { ascending: false }),
        supabase.from("lead_stages").select("*").eq("worker_id", uid),
        supabase.from("team_members").select("id, name").eq("business_id", uid),
      ]);
      return { convs: convs ?? [], stages: stages ?? [], team: team ?? [] };
    },
  });
  if (!q.data) return null;
  const { convs, stages, team } = q.data;
  if (convs.length === 0) return <p className="text-sm text-muted-foreground">Leads appear here once customers message you.</p>;
  async function save(conversation_id: string, patch: { stage?: string; assignee_id?: string | null }) {
    const cur = stages.find((s) => s.conversation_id === conversation_id);
    const { error } = await supabase.from("lead_stages").upsert({ conversation_id, worker_id: uid, stage: cur?.stage ?? "new", assignee_id: cur?.assignee_id ?? null, ...patch, updated_at: new Date().toISOString() });
    if (error) toast.error(error.message);
    void qc.invalidateQueries({ queryKey: ["pipeline"] });
  }
  const counts = LEAD_STAGES.map((s) => [s, convs.filter((c) => (stages.find((x) => x.conversation_id === c.id)?.stage ?? "new") === s).length] as const);
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-2 text-xs">{counts.map(([s, n]) => <span key={s} className="rounded-full bg-secondary px-3 py-1 capitalize">{s}: {n}</span>)}</div>
      {convs.map((c) => {
        const st = stages.find((s) => s.conversation_id === c.id);
        return (
          <div key={c.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-3 text-sm">
            <Link to="/messages/$id" params={{ id: c.id }} className="flex-1 underline">{c.jobs?.title ?? "Direct enquiry"}</Link>
            <select aria-label="Stage" className="rounded-md border border-input bg-background px-2 py-1 capitalize" value={st?.stage ?? "new"} onChange={(e) => save(c.id, { stage: e.target.value })}>
              {LEAD_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            {team.length > 0 && (
              <select aria-label="Assign to" className="rounded-md border border-input bg-background px-2 py-1" value={st?.assignee_id ?? ""} onChange={(e) => save(c.id, { assignee_id: e.target.value || null })}>
                <option value="">Unassigned</option>
                {team.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            )}
          </div>
        );
      })}
      <Button variant="outline" size="sm" className="justify-self-start" onClick={() => {
        const rows = [["Lead", "Stage", "Started"], ...convs.map((c) => [c.jobs?.title ?? "Direct enquiry", stages.find((s) => s.conversation_id === c.id)?.stage ?? "new", new Date(c.created_at).toLocaleDateString("en-GB")])];
        const blob = new Blob([rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n")], { type: "text/csv" });
        const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "jobloom-leads.csv"; a.click();
      }}>Download report (CSV)</Button>
    </div>
  );
}

function Team({ uid }: { uid: string }) {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["team", uid], queryFn: async () => (await supabase.from("team_members").select("*").eq("business_id", uid).order("created_at")).data ?? [] });
  const [f, setF] = useState({ name: "", role_title: "", team_role: "member" });
  return (
    <div className="grid gap-3">
      {q.data?.map((m) => (
        <div key={m.id} className="flex items-center justify-between rounded-xl bg-secondary p-3 text-sm">
          <span><strong>{m.name}</strong>{m.role_title && ` · ${m.role_title}`} <span className="text-muted-foreground capitalize">({m.team_role})</span></span>
          <Button size="icon" variant="ghost" aria-label="Remove" onClick={async () => { await supabase.from("team_members").delete().eq("id", m.id); void qc.invalidateQueries({ queryKey: ["team"] }); }}><Trash2 /></Button>
        </div>
      ))}
      <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto_auto]">
        <Input placeholder="Name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <Input placeholder="Job title, e.g. Electrician" value={f.role_title} onChange={(e) => setF({ ...f, role_title: e.target.value })} />
        <select aria-label="Team role" className="rounded-md border border-input bg-background px-2" value={f.team_role} onChange={(e) => setF({ ...f, team_role: e.target.value })}>
          <option value="member">Member</option><option value="manager">Manager</option>
        </select>
        <Button disabled={!f.name.trim()} onClick={async () => {
          const { error } = await supabase.from("team_members").insert({ business_id: uid, name: f.name.trim(), role_title: f.role_title.trim() || null, team_role: f.team_role });
          if (error) { toast.error(error.message); return; }
          setF({ name: "", role_title: "", team_role: "member" }); void qc.invalidateQueries({ queryKey: ["team"] });
        }}>Add</Button>
      </div>
      <p className="text-xs text-muted-foreground">Team members show on your public profile.</p>
    </div>
  );
}

function Branding({ uid }: { uid: string }) {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["branding", uid], queryFn: async () => (await supabase.from("worker_profiles").select("banner_path, is_sponsored").eq("user_id", uid).maybeSingle()).data });
  const [busy, setBusy] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);
  if (q.isLoading) return null;
  if (!q.data) return <p className="text-sm text-muted-foreground">Create your profile on <Link to="/worker" className="underline">My profile</Link> first.</p>;
  const current = q.data;
  const bannerPath = current.banner_path;
  const refresh = () => void qc.invalidateQueries({ queryKey: ["branding"] });
  return (
    <div className="grid gap-4 text-sm">
      <div>
        <p className="font-medium">Profile banner</p>
        <p className="text-muted-foreground">{bannerPath ? "Your banner is showing on your public profile." : "The Jobloom banner is showing on your public profile until you upload your own (recommended 1600 × 400 px, 4:1 aspect ratio, under 8 MB)."}</p>
        {!bannerPath && <img src={defaultBanner} alt="Default Jobloom profile banner" className="mt-2 h-24 w-full rounded-lg object-cover" />}
        <a href={defaultBanner} download="jobloom-banner-template-1600x400.png" className="mt-2 inline-block text-xs text-muted-foreground underline">Template size download for sizing</a>
        <Input className="mt-2" type="file" accept="image/*" disabled={busy} onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          if (!file.type.startsWith("image/") || file.size > 8 * 1024 * 1024) { toast.error("Banner must be an image under 8 MB"); return; }
          setCropFile(file);
        }} />
        {cropFile && (
          <BannerCropper file={cropFile} busy={busy} onCancel={() => setCropFile(null)} onConfirm={async (blob) => {
            setBusy(true);
            const path = `${uid}/banner-${crypto.randomUUID()}.jpg`;
            const up = await supabase.storage.from("portfolio").upload(path, blob, { contentType: "image/jpeg" });
            if (up.error) { setBusy(false); toast.error(up.error.message); return; }
            if (bannerPath) await supabase.storage.from("portfolio").remove([bannerPath]);
            const saved = await supabase.from("worker_profiles").update({ banner_path: path }).eq("user_id", uid);
            setBusy(false);
            if (saved.error) { toast.error(saved.error.message); return; }
            setCropFile(null);
            toast.success("Banner updated");
            refresh();
          }} />
        )}
        {bannerPath && (
          <Button type="button" variant="outline" className="mt-2" disabled={busy} onClick={async () => {
            setBusy(true);
            const cleared = await supabase.from("worker_profiles").update({ banner_path: null }).eq("user_id", uid);
            if (cleared.error) { setBusy(false); toast.error(cleared.error.message); return; }
            const removed = await supabase.storage.from("portfolio").remove([bannerPath]);
            setBusy(false);
            if (removed.error) toast.error("Banner removed from your profile, but the photo file could not be deleted.");
            else toast.success("Banner removed");
            refresh();
          }}>Remove banner</Button>
        )}
      </div>
      <label className="flex items-start gap-3">
        <input type="checkbox" className="mt-1" checked={current.is_sponsored} onChange={async (e) => {
          await supabase.from("worker_profiles").update({ is_sponsored: e.target.checked }).eq("user_id", uid); refresh();
        }} />
        <span>Show me in sponsored places on Find professionals. Sponsored spots are always labelled "Sponsored", limited to two per page, and never affect reviews or your normal ranking.</span>
      </label>
    </div>
  );
}

function Branches({ uid }: { uid: string }) {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["branches", uid], queryFn: async () => (await supabase.from("branches").select("*").eq("business_id", uid).order("created_at")).data ?? [] });
  const [f, setF] = useState({ name: "", area: "", phone: "" });
  return (
    <div className="grid gap-3">
      {q.data?.map((b) => (
        <div key={b.id} className="flex items-center justify-between rounded-xl bg-secondary p-3 text-sm">
          <span><strong>{b.name}</strong> · {b.area}{b.phone ? ` · ${b.phone}` : ""}</span>
          <Button size="icon" variant="ghost" aria-label="Remove branch" onClick={async () => { await supabase.from("branches").delete().eq("id", b.id); void qc.invalidateQueries({ queryKey: ["branches"] }); }}><Trash2 /></Button>
        </div>
      ))}
      <div className="grid gap-2 md:grid-cols-[1fr_1fr_1fr_auto]">
        <Input placeholder="Branch name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <Input placeholder="Town or postcode area" value={f.area} onChange={(e) => setF({ ...f, area: e.target.value })} />
        <Input placeholder="Phone (optional)" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
        <Button disabled={f.name.trim().length < 2 || f.area.trim().length < 2} onClick={async () => {
          const { error } = await supabase.from("branches").insert({ business_id: uid, name: f.name.trim(), area: f.area.trim(), phone: f.phone.trim() || null });
          if (error) { toast.error(error.message); return; }
          setF({ name: "", area: "", phone: "" }); void qc.invalidateQueries({ queryKey: ["branches"] });
        }}>Add</Button>
      </div>
      <p className="text-xs text-muted-foreground">Branches show on your public profile.</p>
    </div>
  );
}

function Calendar({ uid }: { uid: string }) {
  const q = useQuery({
    queryKey: ["team-calendar", uid],
    queryFn: async () => {
      const { data: convs } = await supabase.from("conversations").select("id, jobs(title)").eq("worker_id", uid);
      const ids = (convs ?? []).map((c) => c.id);
      if (!ids.length) return { rows: [], convs: [], stages: [], team: [] };
      const [{ data: rows }, { data: stages }, { data: team }] = await Promise.all([
        supabase.from("booking_requests").select("id, conversation_id, starts_at, status").in("conversation_id", ids).in("status", ["pending", "accepted"]).gte("starts_at", new Date().toISOString()).order("starts_at"),
        supabase.from("lead_stages").select("conversation_id, assignee_id").eq("worker_id", uid),
        supabase.from("team_members").select("id, name").eq("business_id", uid),
      ]);
      return { rows: rows ?? [], convs: convs ?? [], stages: stages ?? [], team: team ?? [] };
    },
  });
  if (!q.data) return null;
  const { rows, convs, stages, team } = q.data;
  if (!rows.length) return <p className="text-sm text-muted-foreground">No upcoming visits. Requested and accepted visits from your messages appear here, with whoever the lead is assigned to.</p>;
  return (
    <ul className="grid gap-2 text-sm">
      {rows.map((r) => {
        const who = team.find((m) => m.id === stages.find((s) => s.conversation_id === r.conversation_id)?.assignee_id)?.name;
        return (
          <li key={r.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-3">
            <span className="font-medium">{new Date(r.starts_at).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
            <Link to="/messages/$id" params={{ id: r.conversation_id }} className="flex-1 underline">{convs.find((c) => c.id === r.conversation_id)?.jobs?.title ?? "Direct enquiry"}</Link>
            <span className="text-muted-foreground">{who ?? "Unassigned"}</span>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs capitalize">{r.status}</span>
          </li>
        );
      })}
    </ul>
  );
}
