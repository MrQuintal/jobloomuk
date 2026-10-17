import { pageHead } from "@/lib/seo";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageTitle } from "@/components/app/AppShell";
import { UserAvatar, useAvatars } from "@/components/app/UserAvatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

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
  const q = useQuery({
    queryKey: ["inbox", user?.id],
    refetchInterval: 15000,
    queryFn: async () => {
      const { data: convs } = await supabase.from("conversations").select("*").order("last_message_at", { ascending: false });
      const names = await Promise.all((convs ?? []).map((c) => supabase.rpc("conversation_party_names", { _conv: c.id }).then((r) => r.data?.[0])));
      return (convs ?? []).map((c, i) => ({ ...c, names: names[i] }));
    },
  });
  const rows = q.data ?? [];
  const av = useAvatars(rows.map((c) => (c.customer_id === user?.id ? c.worker_id : c.customer_id)));
  return (
    <>
      <PageTitle title="Messages">Talk directly, agree the work and request a visit.</PageTitle>
      {q.isLoading ? <p className="text-muted-foreground">Loading…</p> : rows.length === 0 ? (
        <p className="text-muted-foreground">No conversations yet.</p>
      ) : (
        <ul className="grid max-w-3xl gap-2">
          {rows.map((c) => {
            const otherId = c.customer_id === user?.id ? c.worker_id : c.customer_id;
            const other = c.customer_id === user?.id ? c.names?.worker_name : c.names?.customer_name;
            const name = other || "Jobloom member";
            return (
              <li key={c.id}>
                <Link to="/messages/$id" params={{ id: c.id }} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:shadow-sm">
                  <UserAvatar url={av[otherId]} name={name} className="h-10 w-10" />
                  <span>
                    <p className="font-medium">{name}</p>
                    <p className="text-sm text-muted-foreground">{c.names?.job_title ?? "Direct enquiry"} · {new Date(c.last_message_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</p>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
