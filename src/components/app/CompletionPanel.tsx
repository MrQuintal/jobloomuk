import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { canReview, canStartNewJob } from "@/lib/rules/reputation";
import { StarPicker, RatingBreakdown } from "@/components/app/StarRating";

const FIELDS = [["quality", "Quality of work"], ["reliability", "Reliability"], ["communication", "Communication"], ["value", "Value"]] as const;

export function CompletionPanel({ convId, uid, customerId, workerId, archived = false, onStartNew }: { convId: string; uid: string; customerId: string; workerId: string; archived?: boolean; onStartNew?: () => Promise<void> }) {
  const qc = useQueryClient();
  const key = ["completion", convId];
  const q = useQuery({
    queryKey: key,
    queryFn: async () => {
      const [{ data: c }, { data: r }] = await Promise.all([
        supabase.from("job_completions").select("*").eq("conversation_id", convId).maybeSingle(),
        supabase.from("reviews").select("*").eq("conversation_id", convId).maybeSingle(),
      ]);
      return { c, r };
    },
  });
  const [ratings, setRatings] = useState({ quality: 5, reliability: 5, communication: 5, value: 5 });
  const [body, setBody] = useState("");
  const [reply, setReply] = useState("");
  const [starting, setStarting] = useState(false);
  if (!q.data) return null;
  const { c, r } = q.data;
  const isCustomer = uid === customerId;
  const mine = isCustomer ? c?.customer_confirmed_at : c?.worker_confirmed_at;
  const theirs = isCustomer ? c?.worker_confirmed_at : c?.customer_confirmed_at;
  const refresh = () => qc.invalidateQueries({ queryKey: key });

  return (
    <div className="rounded-2xl border border-border bg-card p-5 text-sm">
      <h2 className="flex items-center gap-2 font-medium"><CheckCircle2 className="size-4" /> {archived ? "Finished job" : "Job finished?"}</h2>
      <p className="mt-2 text-muted-foreground">{archived ? "This job is archived. The review stays on the professional's profile." : "When the work is done, both of you confirm here. This unlocks a review. It isn't proof of payment."}</p>
      <p className="mt-2">You: {mine ? "confirmed" : "not yet"} · Other side: {theirs ? "confirmed" : "not yet"}</p>
      {!mine && (
        <Button size="sm" variant="outline" className="mt-3 w-full" onClick={async () => {
          const { error } = await supabase.rpc("confirm_completion", { _conv: convId });
          if (error) toast.error(error.message); else toast.success("Confirmed");
          refresh();
        }}>Confirm job is finished</Button>
      )}

      {canReview(c, isCustomer, !!r) && (
        <form className="mt-4 space-y-2 border-t border-border pt-4" onSubmit={async (e) => {
          e.preventDefault();
          const { error } = await supabase.from("reviews").insert({ conversation_id: convId, customer_id: uid, worker_id: workerId, ...ratings, body: body.trim() });
          if (error) { toast.error("Reviews need at least 10 characters."); return; }
          toast.success("Review published");
          refresh();
        }}>
          <p className="font-medium">Leave a review</p>
          {FIELDS.map(([k, label]) => (
            <div key={k} className="flex items-center justify-between gap-2">
              <span>{label}</span>
              <StarPicker label={label} value={ratings[k]} onChange={(n) => setRatings({ ...ratings, [k]: n })} />
            </div>
          ))}
          <Textarea rows={3} maxLength={2000} value={body} onChange={(e) => setBody(e.target.value)} placeholder="What was it like working together?" />
          <Button size="sm" type="submit" variant="forest" className="w-full" disabled={body.trim().length < 10}>Publish review</Button>
        </form>
      )}

      {canStartNewJob(c, !!r, archived) && onStartNew && (
        <Button size="sm" variant="forest" className="mt-4 w-full" disabled={starting} onClick={async () => {
          setStarting(true);
          try { await onStartNew(); } finally { setStarting(false); }
        }}>Start a new job</Button>
      )}

      {r && (
        <div className="mt-4 border-t border-border pt-4">
          <p className="font-medium">Review</p>
          <div className="mt-1"><RatingBreakdown r={r} /></div>
          <p className="mt-1">{r.body}</p>
          {r.worker_reply && <p className="mt-2 text-muted-foreground">Reply: {r.worker_reply}</p>}
          {!isCustomer && !r.worker_reply && (
            <form className="mt-2 space-y-2" onSubmit={async (e) => {
              e.preventDefault();
              const { error } = await supabase.from("reviews").update({ worker_reply: reply.trim() }).eq("id", r.id);
              if (error) toast.error(error.message); else refresh();
            }}>
              <Textarea rows={2} maxLength={1000} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Reply publicly (optional)" />
              <Button size="sm" variant="outline" type="submit" disabled={!reply.trim()}>Post reply</Button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
