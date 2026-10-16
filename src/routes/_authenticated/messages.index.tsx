import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageTitle } from "@/components/app/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/messages/")({
  head: () => ({ meta: [{ title: "Messages | Jobloom" }, { name: "robots", content: "noindex" }] }),
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
  return (
    <>
      <PageTitle title="Messages">Talk directly, agree the work and request a visit.</PageTitle>
      {q.isLoading ? <p className="text-muted-foreground">Loading…</p> : q.data?.length === 0 ? (
        <p className="text-muted-foreground">No conversations yet.</p>
      ) : (
        <ul className="grid max-w-3xl gap-2">
          {q.data?.map((c) => {
            const other = c.customer_id === user?.id ? c.names?.worker_name : c.names?.customer_name;
            return (
              <li key={c.id}>
                <Link to="/messages/$id" params={{ id: c.id }} className="block rounded-xl border border-border bg-card p-4 hover:shadow-sm">
                  <p className="font-medium">{other || "Jobloom member"}</p>
                  <p className="text-sm text-muted-foreground">{c.names?.job_title ?? "Direct enquiry"} · {new Date(c.last_message_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
