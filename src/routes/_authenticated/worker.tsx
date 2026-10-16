import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { PageTitle } from "@/components/app/AppShell";
import { RoleGate } from "@/components/app/RoleGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { WEEKDAYS, isValidSlot, slugify } from "@/lib/rules/marketplace";

export const Route = createFileRoute("/_authenticated/worker")({
  head: () => ({ meta: [{ title: "My business | Jobloom" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <RoleGate allow={["worker"]}>
      <WorkerPage />
    </RoleGate>
  ),
});

const card = "rounded-2xl border border-border bg-card p-6";

function WorkerPage() {
  const { user } = useAuth();
  const uid = user!.id;
  const profileQ = useQuery({
    queryKey: ["my-worker-profile", uid],
    queryFn: async () => (await supabase.from("worker_profiles").select("*").eq("user_id", uid).maybeSingle()).data,
  });
  if (profileQ.isLoading) return <p className="text-muted-foreground">Loading…</p>;
  const profile = profileQ.data;
  return (
    <>
      <PageTitle title="My business">Build your profile, show your work and set when you're usually free.</PageTitle>
      {profile?.is_published && (
        <p className="mb-6 text-sm">Your profile is live: <Link to="/pro/$slug" params={{ slug: profile.slug }} className="underline">view public profile</Link></p>
      )}
      <div className="grid max-w-4xl gap-6">
        <ProfileForm uid={uid} profile={profile ?? null} />
        {profile ? (
          <>
            <Specialisms uid={uid} />
            <Availability uid={uid} />
            <Portfolio uid={uid} />
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Save your profile first, then you can add specialisms, availability and portfolio projects.</p>
        )}
      </div>
    </>
  );
}

type Profile = { slug: string; business_name: string; headline: string | null; bio: string | null; base_area: string | null; travel_radius_miles: number; years_experience: number | null; is_published: boolean };

function ProfileForm({ uid, profile }: { uid: string; profile: Profile | null }) {
  const qc = useQueryClient();
  const [f, setF] = useState({
    business_name: profile?.business_name ?? "",
    headline: profile?.headline ?? "",
    bio: profile?.bio ?? "",
    base_area: profile?.base_area ?? "",
    travel_radius_miles: profile?.travel_radius_miles ?? 15,
    years_experience: profile?.years_experience ?? "",
    is_published: profile?.is_published ?? false,
  });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (f.business_name.trim().length < 2) { toast.error("Add your business name"); return; }
    setBusy(true);
    const row = {
      user_id: uid,
      business_name: f.business_name.trim(),
      headline: f.headline.trim() || null,
      bio: f.bio.trim() || null,
      base_area: f.base_area.trim() || null,
      travel_radius_miles: Number(f.travel_radius_miles) || 15,
      years_experience: f.years_experience === "" ? null : Number(f.years_experience),
      is_published: f.is_published,
      slug: profile?.slug ?? `${slugify(f.business_name)}-${uid.slice(0, 6)}`,
    };
    const { error } = await supabase.from("worker_profiles").upsert(row);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Profile saved");
    qc.invalidateQueries({ queryKey: ["my-worker-profile"] });
  }

  return (
    <form onSubmit={save} className={card}>
      <h2 className="text-xl font-medium">Profile</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2"><Label>Business name</Label><Input value={f.business_name} onChange={set("business_name")} maxLength={80} /></div>
        <div className="md:col-span-2"><Label>Headline</Label><Input value={f.headline} onChange={set("headline")} maxLength={140} placeholder="e.g. Kitchen and bathroom fitter in Leeds" /></div>
        <div className="md:col-span-2"><Label>About your work</Label><Textarea rows={5} value={f.bio} onChange={set("bio")} maxLength={3000} /></div>
        <div><Label>Based in (town or postcode area)</Label><Input value={f.base_area} onChange={set("base_area")} maxLength={80} /></div>
        <div><Label>Travel radius (miles)</Label><Input type="number" min={1} max={200} value={f.travel_radius_miles} onChange={set("travel_radius_miles")} /></div>
        <div><Label>Years' experience</Label><Input type="number" min={0} max={70} value={f.years_experience} onChange={set("years_experience")} /></div>
        <label className="flex items-center gap-3 self-end pb-2 text-sm"><Switch checked={f.is_published} onCheckedChange={(v) => setF({ ...f, is_published: v })} /> Show my profile publicly</label>
      </div>
      <Button type="submit" variant="forest" className="mt-5" disabled={busy}>Save profile</Button>
    </form>
  );
}

function Specialisms({ uid }: { uid: string }) {
  const qc = useQueryClient();
  const cats = useQuery({ queryKey: ["cats-client"], queryFn: async () => (await supabase.from("categories").select("id, name").eq("is_active", true).order("sort_order")).data ?? [] });
  const mine = useQuery({ queryKey: ["my-specs", uid], queryFn: async () => (await supabase.from("worker_specialisms").select("id, category_id, is_primary").eq("worker_id", uid)).data ?? [] });
  async function toggle(catId: string) {
    const existing = mine.data?.find((s) => s.category_id === catId);
    const { error } = existing
      ? await supabase.from("worker_specialisms").delete().eq("id", existing.id)
      : await supabase.from("worker_specialisms").insert({ worker_id: uid, category_id: catId, is_primary: (mine.data?.length ?? 0) === 0 });
    if (error) toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["my-specs"] });
  }
  return (
    <section className={card}>
      <h2 className="text-xl font-medium">What you do</h2>
      <p className="mt-1 text-sm text-muted-foreground">Pick the kinds of work you take on. Your first pick is your main specialism.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {(cats.data ?? []).map((c) => {
          const on = mine.data?.some((s) => s.category_id === c.id);
          return <button key={c.id} type="button" onClick={() => toggle(c.id)} className={`rounded-full border px-3 py-1.5 text-sm ${on ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{c.name}</button>;
        })}
      </div>
    </section>
  );
}

function Availability({ uid }: { uid: string }) {
  const qc = useQueryClient();
  const slots = useQuery({ queryKey: ["my-slots", uid], queryFn: async () => (await supabase.from("availability_slots").select("*").eq("worker_id", uid).order("weekday")).data ?? [] });
  const [d, setD] = useState({ weekday: 1, start: "09:00", end: "17:00" });
  async function add() {
    if (!isValidSlot(d.weekday, d.start, d.end)) { toast.error("End time must be after start time"); return; }
    const { error } = await supabase.from("availability_slots").insert({ worker_id: uid, weekday: d.weekday, start_time: d.start, end_time: d.end });
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["my-slots"] });
  }
  async function remove(id: string) {
    await supabase.from("availability_slots").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["my-slots"] });
  }
  return (
    <section className={card}>
      <h2 className="text-xl font-medium">Usual availability</h2>
      <ul className="mt-3 space-y-1 text-sm">
        {(slots.data ?? []).map((s) => (
          <li key={s.id} className="flex items-center gap-2">{WEEKDAYS[s.weekday]} {s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}
            <button aria-label="Remove" onClick={() => remove(s.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button></li>
        ))}
        {slots.data?.length === 0 && <li className="text-muted-foreground">None set yet.</li>}
      </ul>
      <div className="mt-4 flex flex-wrap items-end gap-2">
        <select className="h-9 rounded-md border border-input bg-background px-2 text-sm" value={d.weekday} onChange={(e) => setD({ ...d, weekday: Number(e.target.value) })}>
          {WEEKDAYS.map((w, i) => <option key={w} value={i}>{w}</option>)}
        </select>
        <Input type="time" className="w-32" value={d.start} onChange={(e) => setD({ ...d, start: e.target.value })} />
        <Input type="time" className="w-32" value={d.end} onChange={(e) => setD({ ...d, end: e.target.value })} />
        <Button type="button" variant="outline" onClick={add}>Add</Button>
      </div>
    </section>
  );
}

function Portfolio({ uid }: { uid: string }) {
  const qc = useQueryClient();
  const projects = useQuery({ queryKey: ["my-projects", uid], queryFn: async () => (await supabase.from("portfolio_projects").select("*").eq("worker_id", uid).order("created_at", { ascending: false })).data ?? [] });
  const [f, setF] = useState({ title: "", description: "", location_text: "", completed_on: "", video_url: "" });
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});

  useEffect(() => {
    const paths = (projects.data ?? []).flatMap((p) => p.image_paths);
    if (!paths.length) return;
    supabase.storage.from("portfolio").createSignedUrls(paths, 3600).then(({ data }) => {
      const m: Record<string, string> = {};
      for (const s of data ?? []) if (s.path && s.signedUrl) m[s.path] = s.signedUrl;
      setThumbs(m);
    });
  }, [projects.data]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (f.title.trim().length < 3) { toast.error("Give the project a title"); return; }
    if (f.video_url.trim() && !isValidVideoUrl(f.video_url)) { toast.error("Use a YouTube or Vimeo link"); return; }
    const bad = files.find((x) => !x.type.startsWith("image/") || x.size > 8 * 1024 * 1024);
    if (bad) { toast.error("Photos must be images under 8 MB"); return; }
    setBusy(true);
    const { data: proj, error } = await supabase.from("portfolio_projects").insert({
      worker_id: uid, title: f.title.trim(), description: f.description.trim() || null,
      location_text: f.location_text.trim() || null, completed_on: f.completed_on || null,
      video_url: f.video_url.trim() || null,
    }).select("id").single();
    if (error) { setBusy(false); { toast.error(error.message); return; } }
    const paths: string[] = [];
    for (const file of files.slice(0, 8)) {
      const path = `${uid}/${proj.id}/${crypto.randomUUID()}.${file.name.split(".").pop() || "jpg"}`;
      const up = await supabase.storage.from("portfolio").upload(path, file, { contentType: file.type });
      if (!up.error) paths.push(path);
    }
    if (paths.length) await supabase.from("portfolio_projects").update({ image_paths: paths }).eq("id", proj.id);
    setBusy(false);
    setF({ title: "", description: "", location_text: "", completed_on: "", video_url: "" });
    setFiles([]);
    toast.success("Project added");
    qc.invalidateQueries({ queryKey: ["my-projects"] });
  }

  async function remove(p: { id: string; image_paths: string[] }) {
    if (p.image_paths.length) await supabase.storage.from("portfolio").remove(p.image_paths);
    await supabase.from("portfolio_projects").delete().eq("id", p.id);
    qc.invalidateQueries({ queryKey: ["my-projects"] });
  }

  return (
    <section className={card}>
      <h2 className="text-xl font-medium">Portfolio</h2>
      <div className="mt-4 grid gap-3">
        {(projects.data ?? []).map((p) => (
          <div key={p.id} className="flex gap-4 rounded-xl border border-border p-3">
            {p.image_paths[0] && thumbs[p.image_paths[0]] && <img src={thumbs[p.image_paths[0]]} alt="" className="size-20 rounded-lg object-cover" />}
            <div className="flex-1"><p className="font-medium">{p.title}</p><p className="text-sm text-muted-foreground">{p.image_paths.length} photo(s){p.location_text ? ` · ${p.location_text}` : ""}</p></div>
            <button aria-label="Delete project" onClick={() => remove(p)} className="text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button>
          </div>
        ))}
      </div>
      <form onSubmit={add} className="mt-6 grid gap-3 border-t border-border pt-6 md:grid-cols-2">
        <div className="md:col-span-2"><Label>Project title</Label><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} maxLength={120} /></div>
        <div className="md:col-span-2"><Label>What you did</Label><Textarea rows={3} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} maxLength={2000} /></div>
        <div><Label>Where</Label><Input value={f.location_text} onChange={(e) => setF({ ...f, location_text: e.target.value })} maxLength={80} /></div>
        <div><Label>Finished</Label><Input type="date" value={f.completed_on} onChange={(e) => setF({ ...f, completed_on: e.target.value })} /></div>
        <div className="md:col-span-2"><Label>Photos (up to 8)</Label><Input type="file" accept="image/*" multiple onChange={(e) => setFiles(Array.from(e.target.files ?? []))} /></div>
        <div className="md:col-span-2"><Label>Video link (Pro) — YouTube or Vimeo</Label><Input value={f.video_url} onChange={(e) => setF({ ...f, video_url: e.target.value })} placeholder="https://www.youtube.com/watch?v=…" /></div>
        <Button type="submit" variant="forest" disabled={busy} className="w-fit">{busy ? "Uploading…" : "Add project"}</Button>
      </form>
    </section>
  );
}
