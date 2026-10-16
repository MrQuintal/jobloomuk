import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/app/AppShell";
import { RoleGate } from "@/components/app/RoleGate";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/moderation")({
  head: () => ({ meta: [{ title: "Moderation | Jobloom admin" }, { name: "robots", content: "noindex" }] }),
  component: () => <RoleGate allow={["admin", "super_admin", "moderator"]}><Moderation /></RoleGate>,
});

function Moderation() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["moderation"],
    queryFn: async () => {
      const [{ data: reports }, { data: reviews }, { data: privacy }] = await Promise.all([
        supabase.from("reports").select("*").order("created_at", { ascending: false }).limit(200),
        supabase.from("reviews").select("*").order("created_at", { ascending: false }).limit(100),
        supabase.from("privacy_requests").select("*").order("created_at", { ascending: false }).limit(100),
      ]);
      return { reports: reports ?? [], reviews: reviews ?? [], privacy: privacy ?? [] };
    },
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["moderation"] });
  const act = async (p: PromiseLike<{ error: { message: string } | null }>) => { const { error } = await p; if (error) toast.error(error.message); refresh(); };

  return (
    <>
      <PageTitle title="Moderation">Reports, reviews and privacy requests in one place.</PageTitle>
      {q.isLoading && <p className="text-muted-foreground">Loading…</p>}
      {q.data && (
        <div className="grid gap-10">
          <section>
            <h2 className="text-xl font-medium">Reports ({q.data.reports.filter((r) => r.status === "open").length} open)</h2>
            {q.data.reports.length === 0 && <p className="mt-2 text-muted-foreground">No reports.</p>}
            <ul className="mt-3 space-y-2">
              {q.data.reports.map((r) => (
                <li key={r.id} className="rounded-xl border border-border bg-card p-4 text-sm">
                  <p><span className="font-medium capitalize">{r.target_type}</span> <span className="text-xs text-muted-foreground">{r.target_id}</span> · {r.status}</p>
                  <p className="mt-1">{r.reason}</p>
                  {r.status === "open" && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => act(supabase.from("reports").update({ status: "resolved", resolved_at: new Date().toISOString() }).eq("id", r.id))}>Mark resolved</Button>
                      <Button size="sm" variant="ghost" onClick={() => act(supabase.from("reports").update({ status: "dismissed", resolved_at: new Date().toISOString() }).eq("id", r.id))}>Dismiss</Button>
                      {(r.target_type === "user" || r.target_type === "profile") && (
                        <Button size="sm" variant="destructive" onClick={() => act(supabase.rpc("admin_set_account_status", { _user: r.target_id, _status: "suspended" }))}>Suspend account</Button>
                      )}
                      {r.target_type === "review" && (
                        <Button size="sm" variant="destructive" onClick={() => act(supabase.from("reviews").update({ status: "hidden" }).eq("id", r.target_id))}>Hide review</Button>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-medium">Recent reviews</h2>
            {q.data.reviews.length === 0 && <p className="mt-2 text-muted-foreground">No reviews yet.</p>}
            <ul className="mt-3 space-y-2">
              {q.data.reviews.map((r) => (
                <li key={r.id} className="rounded-xl border border-border bg-card p-4 text-sm">
                  <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("en-GB")} · {r.status}</p>
                  <p className="mt-1">{r.body}</p>
                  <Button size="sm" variant="outline" className="mt-2" onClick={() => act(supabase.from("reviews").update({ status: r.status === "published" ? "hidden" : "published" }).eq("id", r.id))}>
                    {r.status === "published" ? "Hide" : "Restore"}
                  </Button>
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-medium">Account deletion requests</h2>
            {q.data.privacy.length === 0 && <p className="mt-2 text-muted-foreground">None.</p>}
            <ul className="mt-3 space-y-2">
              {q.data.privacy.map((p) => (
                <li key={p.id} className="rounded-xl border border-border bg-card p-4 text-sm">
                  <p>User <span className="text-xs text-muted-foreground">{p.user_id}</span> · {p.status}</p>
                  {p.reason && <p className="mt-1">{p.reason}</p>}
                  {p.status === "pending" && (
                    <div className="mt-2 flex gap-2">
                      <Button size="sm" variant="destructive" onClick={async () => {
                        await act(supabase.rpc("admin_set_account_status", { _user: p.user_id, _status: "suspended" }));
                        await act(supabase.from("privacy_requests").update({ status: "completed", handled_at: new Date().toISOString() }).eq("id", p.id));
                      }}>Close account</Button>
                      <Button size="sm" variant="ghost" onClick={() => act(supabase.from("privacy_requests").update({ status: "rejected", handled_at: new Date().toISOString() }).eq("id", p.id))}>Reject</Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </>
  );
}
