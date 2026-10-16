import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { PageTitle } from "@/components/app/AppShell";
import { RoleGate } from "@/components/app/RoleGate";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { canRespondToJob, isValidMessage, type JobStatus } from "@/lib/rules/marketplace";

export const Route = createFileRoute("/_authenticated/jobs")({
  head: () => ({ meta: [{ title: "Find jobs | Jobloom" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <RoleGate allow={["worker"]}>
      <JobsPage />
    </RoleGate>
  ),
});

function JobsPage() {
  const { user } = useAuth();
  const uid = user!.id;
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["open-jobs", uid],
    queryFn: async () => {
      const [{ data: jobs }, { data: mine }] = await Promise.all([
        supabase.from("jobs").select("*, categories(name)").eq("status", "open").neq("customer_id", uid).order("created_at", { ascending: false }).limit(100),
        supabase.from("job_responses").select("*").eq("worker_id", uid),
      ]);
      return { jobs: jobs ?? [], mine: mine ?? [] };
    },
  });

  return (
    <>
      <PageTitle title="Find jobs">Open jobs posted by customers. Show interest with a short message — the customer decides who to talk to.</PageTitle>
      <div className="grid max-w-4xl gap-4">
        {q.isLoading ? <p className="text-muted-foreground">Loading…</p> : q.data?.jobs.length === 0 ? (
          <p className="text-muted-foreground">No open jobs right now. Make sure your <Link to="/worker" className="underline">profile</Link> is published so customers can find you too.</p>
        ) : q.data?.jobs.map((j) => {
          const resp = q.data.mine.find((r) => r.job_id === j.id);
          return (
            <article key={j.id} className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-xl font-medium">{j.title}</h2>
              <p className="text-sm text-muted-foreground">{[j.categories?.name, j.area, j.timing, j.budget_note].filter(Boolean).join(" · ")}</p>
              <p className="mt-3 whitespace-pre-line text-sm">{j.description}</p>
              {resp ? (
                <ResponseState resp={resp} onChange={() => qc.invalidateQueries({ queryKey: ["open-jobs"] })} />
              ) : canRespondToJob({ status: j.status as JobStatus, customer_id: j.customer_id }, uid) ? (
                <Respond jobId={j.id} uid={uid} onDone={() => qc.invalidateQueries({ queryKey: ["open-jobs"] })} />
              ) : null}
            </article>
          );
        })}
      </div>
    </>
  );
}

function ResponseState({ resp, onChange }: { resp: { id: string; status: string }; onChange: () => void }) {
  const label: Record<string, string> = { sent: "You've shown interest", accepted: "The customer wants to talk — check Messages", declined: "The customer chose someone else", withdrawn: "You withdrew" };
  return (
    <div className="mt-4 flex items-center gap-3 text-sm">
      <span className="rounded-full bg-accent px-2.5 py-0.5 text-accent-foreground">{label[resp.status]}</span>
      {resp.status === "sent" && (
        <Button size="sm" variant="ghost" onClick={async () => {
          const { error } = await supabase.from("job_responses").update({ status: "withdrawn" }).eq("id", resp.id);
          if (error) toast.error(error.message);
          onChange();
        }}>Withdraw</Button>
      )}
    </div>
  );
}

function Respond({ jobId, uid, onDone }: { jobId: string; uid: string; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");
  if (!open) return <Button className="mt-4" variant="forest" size="sm" onClick={() => setOpen(true)}>I'm interested</Button>;
  return (
    <form className="mt-4" onSubmit={async (e) => {
      e.preventDefault();
      if (!isValidMessage(msg)) return;
      const { error } = await supabase.from("job_responses").insert({ job_id: jobId, worker_id: uid, message: msg.trim() });
      if (error) return toast.error(error.message);
      toast.success("Sent to the customer");
      onDone();
    }}>
      <Textarea rows={3} maxLength={2000} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Say why you're a good fit and when you could do it." />
      <div className="mt-2 flex gap-2">
        <Button size="sm" type="submit" variant="forest" disabled={!isValidMessage(msg)}>Send</Button>
        <Button size="sm" type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </form>
  );
}
