import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PageTitle } from "@/components/app/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({ meta: [{ title: "Account & privacy | Jobloom" }, { name: "robots", content: "noindex" }] }),
  component: Account,
});

function Account() {
  const { user } = useAuth();
  const uid = user!.id;
  const qc = useQueryClient();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const reqs = useQuery({
    queryKey: ["privacy", uid],
    queryFn: async () => (await supabase.from("privacy_requests").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  async function exportData() {
    setBusy(true);
    const tables = ["profiles", "user_roles", "worker_profiles", "worker_specialisms", "portfolio_projects", "availability_slots", "jobs", "job_responses", "conversations", "messages", "booking_requests", "reviews", "reports", "notifications"] as const;
    const out: Record<string, unknown> = { exported_at: new Date().toISOString(), email: user!.email };
    for (const t of tables) out[t] = (await supabase.from(t).select("*")).data ?? [];
    const blob = new Blob([JSON.stringify(out, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "jobloom-my-data.json";
    a.click();
    setBusy(false);
  }

  const pending = reqs.data?.some((r) => r.status === "pending");
  return (
    <>
      <PageTitle title="Account & privacy">Your data belongs to you.</PageTitle>
      <div className="grid max-w-2xl gap-6">
        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-medium">Download your data</h2>
          <p className="mt-1 text-sm text-muted-foreground">Get a copy of everything linked to your account as a file.</p>
          <Button className="mt-4" variant="outline" onClick={exportData} disabled={busy}>{busy ? "Preparing…" : "Download my data"}</Button>
        </section>
        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-medium">Close my account</h2>
          <p className="mt-1 text-sm text-muted-foreground">Ask us to delete your account. Our team handles this within 30 days. Some records may be kept where the law requires.</p>
          {pending ? <p className="mt-4 text-sm font-medium">Your request is with our team.</p> : (
            <form className="mt-4 space-y-2" onSubmit={async (e) => {
              e.preventDefault();
              const { error } = await supabase.from("privacy_requests").insert({ user_id: uid, kind: "deletion", reason: reason.trim() || null });
              if (error) toast.error(error.message); else toast.success("Request sent");
              qc.invalidateQueries({ queryKey: ["privacy", uid] });
            }}>
              <Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (optional)" />
              <Button type="submit" variant="destructive">Request account deletion</Button>
            </form>
          )}
        </section>
      </div>
    </>
  );
}
