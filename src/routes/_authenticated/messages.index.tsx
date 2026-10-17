import { pageHead } from "@/lib/seo";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { PageTitle } from "@/components/app/AppShell";
import { UserAvatar, useAvatars } from "@/components/app/UserAvatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { hiddenFromInbox } from "@/lib/rules/marketplace";

export const Route = createFileRoute("/_authenticated/messages/")({
  staticData: { sitemap: false },
  head: () => {
    const head = pageHead("/messages", "Messages", "Read your private Jobloom conversations with customers and professionals.");
    return { ...head, meta: [...head.meta, { name: "robots", content: "noindex" }] };
  },
  component: Inbox,
});

function Inbox() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [removing, setRemoving] = useState<string | null>(null);
  const q = useQuery({
    queryKey: ["inbox", user?.id],
    refetchInterval: 15000,
    queryFn: async () => {
      const { data: convs } = await supabase.from("conversations").select("*").order("last_message_at", { ascending: false });
      const names = await Promise.all((convs ?? []).map((c) => supabase.rpc("conversation_party_names", { _conv: c.id }).then((r) => r.data?.[0])));
      return (convs ?? []).map((c, i) => ({ ...c, names: names[i] }));
    },
  });
  const rows = (q.data ?? []).filter((c) => !user || !hiddenFromInbox(c, user.id));
  const active = rows.filter((c) => !c.archived_at);
  const finished = rows.filter((c) => c.archived_at);
  const av = useAvatars(rows.map((c) => (c.customer_id === user?.id ? c.worker_id : c.customer_id)));
  async function remove(id: string) {
    if (!window.confirm("Remove this conversation from your inbox? The messages and any review stay. It comes back if someone sends a new message.")) return;
    setRemoving(id);
    const { error } = await supabase.rpc("hide_conversation_from_inbox", { _conv: id });
    setRemoving(null);
    if (error) { toast.error(error.message); return; }
    toast.success("Removed from your inbox");
    void qc.invalidateQueries({ queryKey: ["inbox"] });
  }
  const item = (c: (typeof rows)[number]) => {
    const otherId = c.customer_id === user?.id ? c.worker_id : c.customer_id;
    const other = c.customer_id === user?.id ? c.names?.worker_name : c.names?.customer_name;
    const name = other || "Jobloom member";
    return (
      <li key={c.id} className="flex items-stretch gap-2">
        <Link to="/messages/$id" params={{ id: c.id }} className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-border bg-card p-4 hover:shadow-sm">
          <UserAvatar url={av[otherId]} name={name} className="h-10 w-10" />
          <span>
            <p className="font-medium">{name}</p>
            <p className="text-sm text-muted-foreground">{c.archived_at ? "Finished job" : c.names?.job_title ?? "Direct enquiry"} · {new Date(c.last_message_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</p>
          </span>
        </Link>
        <Button type="button" variant="ghost" size="sm" className="shrink-0 self-center" disabled={removing === c.id} onClick={() => void remove(c.id)}>Remove from inbox</Button>
      </li>
    );
  };
  return (
    <>
      <PageTitle title="Messages">Talk directly, agree the work and request a visit.</PageTitle>
      {q.isLoading ? <p className="text-muted-foreground">Loading…</p> : rows.length === 0 ? (
        <p className="text-muted-foreground">No conversations in your inbox.</p>
      ) : (
        <div className="grid max-w-3xl gap-6">
          {active.length === 0 ? <p className="text-muted-foreground">No current conversations.</p> : <ul className="grid gap-2">{active.map(item)}</ul>}
          {finished.length > 0 && (
            <details>
              <summary className="cursor-pointer text-sm text-muted-foreground">Finished jobs ({finished.length})</summary>
              <ul className="mt-2 grid gap-2">{finished.map(item)}</ul>
            </details>
          )}
        </div>
      )}
    </>
  );
}
