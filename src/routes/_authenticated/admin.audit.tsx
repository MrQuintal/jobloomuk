import { pageHead } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageTitle } from "@/components/app/AppShell";
import { RoleGate } from "@/components/app/RoleGate";

export const Route = createFileRoute("/_authenticated/admin/audit")({
  head: () => {
    const head = pageHead("/admin/audit", "Admin audit log", "Review the permanent record of important Jobloom account and role changes.");
    return { ...head, meta: [...head.meta, { name: "robots", content: "noindex" }] };
  },
  component: () => (
    <RoleGate allow={["admin", "super_admin"]}>
      <Audit />
    </RoleGate>
  ),
});

function Audit() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["audit"],
    queryFn: async () => {
      const { data, error } = await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data;
    },
  });
  return (
    <>
      <PageTitle title="Audit log">A permanent record of important changes. Entries can't be edited or deleted.</PageTitle>
      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      {error && <p className="text-destructive">Couldn't load the audit log.</p>}
      {data?.length === 0 && <p className="text-muted-foreground">Nothing recorded yet.</p>}
      <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
        {data?.map((e) => (
          <li key={e.id} className="flex flex-wrap justify-between gap-2 p-4 text-sm">
            <span><span className="font-medium">{e.action}</span> <span className="text-muted-foreground">{JSON.stringify(e.details)}</span></span>
            <span className="text-muted-foreground">{new Date(e.created_at).toLocaleString("en-GB")}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
