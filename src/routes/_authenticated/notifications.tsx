import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/app/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({ meta: [{ title: "Notifications | Jobloom" }, { name: "robots", content: "noindex" }] }),
  component: Notifications,
});

function Notifications() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data, error } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data;
    },
  });
  async function markAll() {
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", user!.id).is("read_at", null);
    qc.invalidateQueries({ queryKey: ["notifications"] });
    qc.invalidateQueries({ queryKey: ["unread"] });
  }
  return (
    <>
      <PageTitle title="Notifications">Updates about your messages, jobs, visits and reviews.</PageTitle>
      <Button size="sm" variant="outline" onClick={markAll} className="mb-4">Mark all as read</Button>
      {q.isLoading && <p className="text-muted-foreground">Loading…</p>}
      {q.error && <p className="text-destructive">Couldn't load notifications.</p>}
      {q.data?.length === 0 && <p className="text-muted-foreground">Nothing yet.</p>}
      <ul className="max-w-2xl divide-y divide-border rounded-2xl border border-border bg-card">
        {q.data?.map((n) => (
          <li key={n.id} className={`p-4 text-sm ${n.read_at ? "text-muted-foreground" : "font-medium"}`}>
            {n.link ? <Link to={n.link} className="hover:underline">{n.title}</Link> : n.title}
            <p className="text-xs font-normal text-muted-foreground">{new Date(n.created_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</p>
          </li>
        ))}
      </ul>
    </>
  );
}
