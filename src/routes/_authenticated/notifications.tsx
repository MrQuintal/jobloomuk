import { pageHead } from "@/lib/seo";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Check, CheckCheck, Trash2, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { PageTitle } from "@/components/app/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { playChime, setSoundEnabled, soundEnabled } from "@/lib/notify-sound";

export const Route = createFileRoute("/_authenticated/notifications")({
  staticData: { sitemap: false },
  head: () => {
    const head = pageHead("/notifications", "Notifications", "Read Jobloom updates about your jobs, messages, booking requests and reviews.");
    return { ...head, meta: [...head.meta, { name: "robots", content: "noindex" }] };
  },
  component: Notifications,
});

function Notifications() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [sound, setSound] = useState(false);
  useEffect(() => setSound(soundEnabled()), []);
  const q = useQuery({
    queryKey: ["notifications"],
    refetchInterval: 10000,
    queryFn: async () => {
      const { data, error } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data;
    },
  });
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["notifications"] });
    qc.invalidateQueries({ queryKey: ["unread"] });
  };
  async function markAll() {
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", user!.id).is("read_at", null);
    refresh();
  }
  async function clearAll() {
    if (!q.data?.length) return;
    if (!window.confirm("Clear all notifications? This empties the list.")) return;
    const { error } = await supabase.from("notifications").delete().eq("user_id", user!.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Notifications cleared");
    refresh();
  }
  async function markOne(id: string) {
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id).is("read_at", null);
    refresh();
  }
  async function open(n: { id: string; link: string | null; read_at: string | null }) {
    if (!n.read_at) await markOne(n.id);
    if (n.link) navigate({ href: n.link });
  }
  const unread = q.data?.filter((n) => !n.read_at).length ?? 0;

  return (
    <>
      <PageTitle title="Notifications">Updates about your messages, jobs, visits and reviews.</PageTitle>
      <div className="mb-4 flex max-w-2xl flex-wrap items-center gap-3">
        <span className={`rounded-full px-3 py-1 text-sm font-medium ${unread ? "bg-bloom text-bloom-foreground" : "bg-muted text-muted-foreground"}`}>
          {unread ? `${unread} unread` : "All caught up"}
        </span>
        <Button size="sm" variant="outline" onClick={markAll} disabled={!unread}><CheckCheck /> Mark all as read</Button>
        <Button size="sm" variant="outline" onClick={clearAll} disabled={!q.data?.length}><Trash2 /> Clear all</Button>
        <label className="ml-auto flex items-center gap-2 text-sm">
          {sound ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
          Sound {sound ? "on" : "off"}
          <Switch checked={sound} onCheckedChange={(v) => { setSound(v); setSoundEnabled(v); if (v) playChime(); }} />
        </label>
      </div>
      {q.isLoading && <p className="text-muted-foreground">Loading…</p>}
      {q.error && <p className="text-destructive">Couldn't load notifications.</p>}
      {q.data?.length === 0 && <p className="text-muted-foreground">Nothing yet.</p>}
      <ul className="max-w-2xl divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
        {q.data?.map((n) => (
          <li key={n.id} className={`flex items-center gap-3 p-4 text-sm transition-colors ${n.read_at ? "opacity-70" : "border-l-4 border-l-bloom bg-bloom/10"}`}>
            <span className={`size-2.5 shrink-0 rounded-full ${n.read_at ? "bg-transparent" : "bg-bloom"}`} aria-hidden />
            <button type="button" onClick={() => open(n)} className="flex-1 text-left">
              <span className={n.read_at ? "text-muted-foreground" : "font-semibold"}>{n.title}</span>
              <span className="block text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</span>
            </button>
            {n.read_at ? (
              <span className="flex items-center gap-1 text-xs text-muted-foreground"><Check className="size-3" /> Read</span>
            ) : (
              <Button size="sm" variant="ghost" onClick={() => markOne(n.id)}><Check /> Mark read</Button>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
