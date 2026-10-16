import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { isValidMessage, nextBookingStatuses, type BookingStatus } from "@/lib/rules/marketplace";

export const Route = createFileRoute("/_authenticated/messages/$id")({
  head: () => ({ meta: [{ title: "Conversation | Jobloom" }, { name: "robots", content: "noindex" }] }),
  component: Thread,
});

const ACTION_LABEL: Record<BookingStatus, string> = { accepted: "Accept", declined: "Decline", cancelled: "Cancel request", requested: "" };
const STATUS_LABEL: Record<BookingStatus, string> = { requested: "Waiting for reply", accepted: "Accepted", declined: "Declined", cancelled: "Cancelled" };

function Thread() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const uid = user!.id;
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["thread", id],
    refetchInterval: 5000,
    queryFn: async () => {
      const [{ data: msgs }, { data: books }, { data: names }, { data: conv }] = await Promise.all([
        supabase.from("messages").select("*").eq("conversation_id", id).order("created_at"),
        supabase.from("booking_requests").select("*").eq("conversation_id", id).order("starts_at"),
        supabase.rpc("conversation_party_names", { _conv: id }),
        supabase.from("conversations").select("*").eq("id", id).maybeSingle(),
      ]);
      return { msgs: msgs ?? [], books: books ?? [], names: names?.[0], conv };
    },
  });
  const [body, setBody] = useState("");
  const [when, setWhen] = useState("");
  const [note, setNote] = useState("");
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => end.current?.scrollIntoView({ block: "end" }), [q.data?.msgs.length]);
  const refresh = () => qc.invalidateQueries({ queryKey: ["thread", id] });

  if (q.isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (!q.data?.conv) return <p>Conversation not found.</p>;
  const { conv, names, msgs, books } = q.data;
  const other = conv.customer_id === uid ? names?.worker_name : names?.customer_name;

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidMessage(body)) return;
    const { error } = await supabase.from("messages").insert({ conversation_id: id, sender_id: uid, body: body.trim() });
    if (error) return toast.error(error.message);
    setBody("");
    refresh();
  }
  async function requestVisit(e: React.FormEvent) {
    e.preventDefault();
    const d = new Date(when);
    if (!when || d.getTime() < Date.now()) return toast.error("Pick a future date and time");
    const { error } = await supabase.from("booking_requests").insert({ conversation_id: id, requested_by: uid, starts_at: d.toISOString(), note: note.trim() || null });
    if (error) return toast.error(error.message);
    setWhen(""); setNote("");
    toast.success("Visit requested");
    refresh();
  }
  async function decide(bookingId: string, status: BookingStatus) {
    const { error } = await supabase.from("booking_requests").update({ status }).eq("id", bookingId);
    if (error) toast.error(error.message);
    refresh();
  }

  return (
    <div className="grid max-w-5xl gap-6 lg:grid-cols-[1fr_20rem]">
      <section className="flex min-h-[60vh] flex-col rounded-2xl border border-border bg-card">
        <header className="border-b border-border p-4">
          <Link to="/messages" className="mb-1 flex items-center gap-1 text-xs text-muted-foreground"><ArrowLeft className="size-3" /> All messages</Link>
          <h1 className="text-xl font-medium">{other || "Jobloom member"}</h1>
          <p className="text-sm text-muted-foreground">{names?.job_title ?? "Direct enquiry"}</p>
        </header>
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {msgs.map((m) => (
            <div key={m.id} className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${m.sender_id === uid ? "ml-auto bg-primary text-primary-foreground" : "bg-muted"}`}>
              <p className="whitespace-pre-line">{m.body}</p>
              <p className="mt-1 text-[10px] opacity-70">{new Date(m.created_at).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}</p>
            </div>
          ))}
          <div ref={end} />
        </div>
        <form onSubmit={send} className="flex gap-2 border-t border-border p-3">
          <Textarea rows={2} maxLength={4000} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write a message…" className="resize-none" />
          <Button type="submit" variant="forest" disabled={!isValidMessage(body)}>Send</Button>
        </form>
      </section>
      <aside className="space-y-4">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="flex items-center gap-2 font-medium"><CalendarDays className="size-4" /> Visits</h2>
          {books.length === 0 && <p className="mt-2 text-sm text-muted-foreground">No visits requested yet.</p>}
          <ul className="mt-3 space-y-3">
            {books.map((b) => {
              const actions = nextBookingStatuses(b.status as BookingStatus, b.requested_by === uid);
              return (
                <li key={b.id} className="rounded-lg border border-border p-3 text-sm">
                  <p className="font-medium">{new Date(b.starts_at).toLocaleString("en-GB", { dateStyle: "full", timeStyle: "short" })}</p>
                  {b.note && <p className="mt-1">{b.note}</p>}
                  <p className="mt-1 text-xs text-muted-foreground">{STATUS_LABEL[b.status as BookingStatus]}</p>
                  {actions.length > 0 && (
                    <div className="mt-2 flex gap-2">{actions.map((a) => <Button key={a} size="sm" variant={a === "accepted" ? "forest" : "outline"} onClick={() => decide(b.id, a)}>{ACTION_LABEL[a]}</Button>)}</div>
                  )}
                </li>
              );
            })}
          </ul>
          <form onSubmit={requestVisit} className="mt-4 space-y-2 border-t border-border pt-4">
            <p className="text-sm font-medium">Request a visit</p>
            <Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
            <Input value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} placeholder="Note (optional)" />
            <Button type="submit" size="sm" variant="outline" className="w-full">Send request</Button>
          </form>
        </div>
        <p className="text-xs text-muted-foreground">Jobloom never takes payment. Agree the price directly and never pay anyone who asks you to pay through an unfamiliar link.</p>
      </aside>
    </div>
  );
}
