import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ExternalLink, Trash2, ImagePlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageTitle } from "@/components/app/AppShell";
import { RoleGate } from "@/components/app/RoleGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth";
import { categoriesQuery } from "@/lib/queries";
import { MAX_PORTFOLIO_IMAGES, publishBlockers, slugify, WEEKDAYS } from "@/lib/rules/profile";
import { signPortfolioPaths, uploadPortfolioImage } from "@/lib/storage";

export const Route = createFileRoute("/_authenticated/worker")({
  head: () => ({ meta: [{ title: "My business | Jobloom" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <RoleGate allow={["worker"]}>
      <WorkerHome />
    </RoleGate>
  ),
});

function useWorkerData(userId: string) {
  return useQuery({
    queryKey: ["worker-self", userId],
    queryFn: async () => {
      const [p, s, pr, a] = await Promise.all([
        supabase.from("worker_profiles").select("*").eq("user_id", userId).maybeSingle(),
        supabase.from("worker_specialisms").select("*").eq("worker_id", userId),
        supabase.from("portfolio_projects").select("*").eq("worker_id", userId).order("created_at", { ascending: false }),
        supabase.from("availability_slots").select("*").eq("worker_id", userId).order("weekday"),
      ]);
      const err = p.error ?? s.error ?? pr.error ?? a.error;
      if (err) throw err;
      return { profile: p.data, specialisms: s.data ?? [], projects: pr.data ?? [], slots: a.data ?? [] };
    },
  });
}

function WorkerHome() {
  const { user } = useAuth();
  const { data, isLoading, error } = useWorkerData(user!.id);
  if (isLoading) return <p className="text-muted-foreground">Loading your business…</p>;
  if (error || !data) return <p className="text-destructive">Couldn't load your details. Please refresh.</p>;
  const p = data.profile;
  return (
    <>
      <PageTitle title="My business">Build your profile, show your work and set when you're available.</PageTitle>
      {p && (
        <div className="mb-6 flex flex-wrap items-center gap-3 text-sm">
          <span className={`rounded-full px-3 py-1 ${p.is_published ? "bg-forest text-forest-foreground" : "bg-muted text-muted-foreground"}`}>{p.is_published ? "Published" : "Not published"}</span>
          {p.is_published && <Link to="/pros/$slug" params={{ slug: p.slug }} className="inline-flex items-center gap-1 underline">View public profile <ExternalLink className="size-3" /></Link>}
          <Link to="/jobs" className="underline">Browse customer jobs</Link>
        </div>
      )}
      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="portfolio" disabled={!p}>Portfolio</TabsTrigger>
          <TabsTrigger value="availability" disabled={!p}>Availability</TabsTrigger>
        </TabsList>
        <TabsContent value="profile"><ProfileForm data={data} /></TabsContent>
        <TabsContent value="portfolio"><Portfolio projects={data.projects} /></TabsContent>
        <TabsContent value="availability"><Availability slots={data.slots} /></TabsContent>
      </Tabs>
    </>
  );
}

type WorkerData = NonNullable<ReturnType<typeof useWorkerData>["data"]>;

function ProfileForm({ data }: { data: WorkerData }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: cats = [] } = useQuery(categoriesQuery);
  const p = data.profile;
  const [f, setF] = useState({
    business_name: p?.business_name ?? "",
    headline: p?.headline ?? "",
    bio: p?.bio ?? "",
    base_area: p?.base_area ?? "",
    travel_radius_miles: p?.travel_radius_miles ?? 15,
    years_experience: p?.years_experience ?? "",
  });
  const [chosen, setChosen] = useState<string[]>(data.specialisms.map((s) => s.category_id));
  const [primary, setPrimary] = useState<string | null>(data.specialisms.find((s) => s.is_primary)?.category_id ?? null);
  const [busy, setBusy] = useState(false);
  const blockers = publishBlockers({ ...f, specialismCount: chosen.length });

  async function save(publish?: boolean) {
    setBusy(true);
    try {
      const row = {
        user_id: user!.id,
        slug: p?.slug ?? `${slugify(f.business_name) || "pro"}-${user!.id.slice(0, 6)}`,
        business_name: f.business_name.trim(),
        headline: f.headline.trim() || null,
        bio: f.bio.trim() || null,
        base_area: f.base_area.trim() || null,
        travel_radius_miles: Number(f.travel_radius_miles) || 0,
        years_experience: f.years_experience === "" ? null : Number(f.years_experience),
        is_published: publish ?? p?.is_published ?? false,
      };
      if (!row.business_name) throw new Error("Add your business or trading name first");
      const { error } = await supabase.from("worker_profiles").upsert(row);
      if (error) throw error;
      await supabase.from("worker_specialisms").delete().eq("worker_id", user!.id);
      if (chosen.length) {
        const { error: e2 } = await supabase.from("worker_specialisms").insert(chosen.map((c) => ({ worker_id: user!.id, category_id: c, is_primary: c === primary })));
        if (e2) throw e2;
      }
      toast.success(publish === true ? "Profile published" : publish === false ? "Profile hidden" : "Saved");
      qc.invalidateQueries({ queryKey: ["worker-self"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 grid max-w-3xl gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Business or trading name"><Input value={f.business_name} onChange={(e) => setF({ ...f, business_name: e.target.value })} /></Field>
        <Field label="Area you're based in (e.g. Leeds LS6)"><Input value={f.base_area} onChange={(e) => setF({ ...f, base_area: e.target.value })} /></Field>
      </div>
      <Field label="Headline"><Input placeholder="Kitchen fitter with 12 years' experience" value={f.headline} onChange={(e) => setF({ ...f, headline: e.target.value })} /></Field>
      <Field label="About you"><Textarea rows={5} value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} /></Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="How far you'll travel (miles)"><Input type="number" min={0} max={200} value={f.travel_radius_miles} onChange={(e) => setF({ ...f, travel_radius_miles: Number(e.target.value) })} /></Field>
        <Field label="Years of experience"><Input type="number" min={0} max={80} value={f.years_experience} onChange={(e) => setF({ ...f, years_experience: e.target.value })} /></Field>
      </div>
      <div>
        <Label>Services you offer — tap ★ on the one you do most</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {cats.map((c) => {
            const on = chosen.includes(c.id);
            return (
              <span key={c.id} className={`inline-flex items-center overflow-hidden rounded-full border text-sm ${on ? "border-forest bg-forest text-forest-foreground" : "border-border"}`}>
                <button type="button" className="px-3 py-1" onClick={() => { setChosen(on ? chosen.filter((x) => x !== c.id) : [...chosen, c.id]); if (on && primary === c.id) setPrimary(null); }}>{c.name}</button>
                {on && <button type="button" aria-label={`Mark ${c.name} as what I do most`} className={`pr-3 ${primary === c.id ? "text-bloom" : "opacity-50"}`} onClick={() => setPrimary(c.id)}>★</button>}
              </span>
            );
          })}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="forest" disabled={busy} onClick={() => save()}>Save</Button>
        {p?.is_published ? (
          <Button variant="pill" disabled={busy} onClick={() => save(false)}>Hide profile</Button>
        ) : (
          <Button variant="bloom" disabled={busy || blockers.length > 0} onClick={() => save(true)}>Publish profile</Button>
        )}
      </div>
      {!p?.is_published && blockers.length > 0 && <p className="text-sm text-muted-foreground">To publish: {blockers.join(" · ")}</p>}
    </div>
  );
}

function Portfolio({ projects }: { projects: WorkerData["projects"] }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: cats = [] } = useQuery(categoriesQuery);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [f, setF] = useState({ title: "", description: "", category_id: "", location_text: "", completed_on: "" });
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void signPortfolioPaths(projects.flatMap((p) => p.image_paths)).then(setUrls);
  }, [projects]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const paths: string[] = [];
      for (const file of files.slice(0, MAX_PORTFOLIO_IMAGES)) paths.push(await uploadPortfolioImage(user!.id, file));
      const { error } = await supabase.from("portfolio_projects").insert({
        worker_id: user!.id,
        title: f.title.trim(),
        description: f.description.trim() || null,
        category_id: f.category_id || null,
        location_text: f.location_text.trim() || null,
        completed_on: f.completed_on || null,
        image_paths: paths,
      });
      if (error) throw error;
      setF({ title: "", description: "", category_id: "", location_text: "", completed_on: "" });
      setFiles([]);
      toast.success("Project added");
      qc.invalidateQueries({ queryKey: ["worker-self"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't add project");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string, paths: string[]) {
    const { error } = await supabase.from("portfolio_projects").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (paths.length) await supabase.storage.from("portfolio").remove(paths);
    qc.invalidateQueries({ queryKey: ["worker-self"] });
  }

  return (
    <div className="mt-6 grid gap-8 lg:grid-cols-[22rem_1fr]">
      <form onSubmit={add} className="grid h-fit gap-4 rounded-3xl border border-border bg-card p-6">
        <h2 className="text-xl font-medium">Add a project</h2>
        <Field label="Title"><Input required value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
        <Field label="What you did"><Textarea rows={4} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
        <Field label="Service">
          <select className="h-9 rounded-md border border-input bg-background px-3 text-sm" value={f.category_id} onChange={(e) => setF({ ...f, category_id: e.target.value })}>
            <option value="">Choose…</option>
            {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Town"><Input value={f.location_text} onChange={(e) => setF({ ...f, location_text: e.target.value })} /></Field>
          <Field label="Finished"><Input type="date" value={f.completed_on} onChange={(e) => setF({ ...f, completed_on: e.target.value })} /></Field>
        </div>
        <Field label={`Photos (up to ${MAX_PORTFOLIO_IMAGES})`}>
          <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-input px-3 py-3 text-sm text-muted-foreground">
            <ImagePlus className="size-4" /> {files.length ? `${files.length} selected` : "Choose photos"}
            <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => setFiles(Array.from(e.target.files ?? []))} />
          </label>
        </Field>
        <Button type="submit" variant="bloom" disabled={busy}>{busy ? "Uploading…" : "Add project"}</Button>
      </form>
      <div className="grid gap-4 sm:grid-cols-2">
        {projects.length === 0 && <p className="text-muted-foreground">No projects yet. Add your best work first.</p>}
        {projects.map((p) => (
          <div key={p.id} className="overflow-hidden rounded-3xl border border-border bg-card">
            {p.image_paths[0] && urls[p.image_paths[0]] ? <img src={urls[p.image_paths[0]]} alt={p.title} className="aspect-[4/3] w-full object-cover" loading="lazy" /> : <div className="aspect-[4/3] bg-muted" />}
            <div className="flex items-start justify-between gap-2 p-4">
              <div>
                <h3 className="font-medium">{p.title}</h3>
                <p className="text-xs text-muted-foreground">{[p.location_text, p.completed_on && new Date(p.completed_on).toLocaleDateString("en-GB", { month: "short", year: "numeric" }), `${p.image_paths.length} photos`].filter(Boolean).join(" · ")}</p>
              </div>
              <Button variant="ghost" size="icon" aria-label="Delete project" onClick={() => remove(p.id, p.image_paths)}><Trash2 /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Availability({ slots }: { slots: WorkerData["slots"] }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [f, setF] = useState({ weekday: 1, start_time: "08:00", end_time: "17:00" });
  async function add() {
    const { error } = await supabase.from("availability_slots").insert({ worker_id: user!.id, ...f });
    if (error) {
      toast.error(error.message.includes("check") ? "End time must be after start time" : error.message);
      return;
    }
    qc.invalidateQueries({ queryKey: ["worker-self"] });
  }
  async function remove(id: string) {
    await supabase.from("availability_slots").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["worker-self"] });
  }
  return (
    <div className="mt-6 max-w-xl">
      <p className="text-sm text-muted-foreground">Your usual working hours. Customers see these on your profile and can request a visit in messages.</p>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <Field label="Day">
          <select className="h-9 rounded-md border border-input bg-background px-3 text-sm" value={f.weekday} onChange={(e) => setF({ ...f, weekday: Number(e.target.value) })}>
            {WEEKDAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
          </select>
        </Field>
        <Field label="From"><Input type="time" value={f.start_time} onChange={(e) => setF({ ...f, start_time: e.target.value })} /></Field>
        <Field label="To"><Input type="time" value={f.end_time} onChange={(e) => setF({ ...f, end_time: e.target.value })} /></Field>
        <Button variant="forest" onClick={add}>Add</Button>
      </div>
      <ul className="mt-6 divide-y divide-border rounded-2xl border border-border bg-card">
        {slots.length === 0 && <li className="p-4 text-sm text-muted-foreground">No hours added yet.</li>}
        {slots.map((s) => (
          <li key={s.id} className="flex items-center justify-between p-3 text-sm">
            <span>{WEEKDAYS[s.weekday]} · {s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}</span>
            <Button variant="ghost" size="icon" aria-label="Remove" onClick={() => remove(s.id)}><Trash2 /></Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
