import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { calendarDayKey, dayTakings, isAgreedVisit, monthCells, visitDayKey, visitInstant } from "@/lib/rules/calendar";
import { invoiceAmountPence } from "@/lib/rules/invoice";
import { formatPence } from "@/lib/rules/plans";

const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const NOTE_LIMIT = 200;

type Visit = {
  id: string;
  conversation_id: string;
  starts_at: string;
  status: string;
  amount_pence: number | null;
  note: string | null;
  title: string;
  customer: string;
  who: string | null;
  assigneeId: string | null;
  open: boolean;
};

type Person = { id: string; customer: string; title: string };

function dayHeading(key: string): string {
  const when = visitInstant(key, "12:00");
  return (when ?? new Date()).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export function BusinessCalendar({ uid }: { uid: string }) {
  const qc = useQueryClient();
  const now = new Date();
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [selected, setSelected] = useState(calendarDayKey(now));
  const [member, setMember] = useState("");
  const [draft, setDraft] = useState({ conversationId: "", time: "", note: "" });
  const q = useQuery({
    queryKey: ["business-calendar", uid],
    queryFn: async () => {
      const { data: convs } = await supabase.from("conversations").select("id, archived_at, jobs(title)").eq("worker_id", uid);
      const ids = (convs ?? []).map((c) => c.id);
      if (!ids.length) return { visits: [] as Visit[], people: [] as Person[], team: [] as { id: string; name: string }[] };
      const [{ data: rows }, { data: stages }, { data: team }, names] = await Promise.all([
        supabase.from("booking_requests").select("id, conversation_id, starts_at, status, amount_pence, note").in("conversation_id", ids).in("status", ["requested", "accepted"]).order("starts_at"),
        supabase.from("lead_stages").select("conversation_id, assignee_id").eq("worker_id", uid),
        supabase.from("team_members").select("id, name").eq("business_id", uid),
        Promise.all((convs ?? []).map(async (c) => {
          const { data } = await supabase.rpc("conversation_party_names", { _conv: c.id });
          return { id: c.id, customer: data?.[0]?.customer_name ?? "Customer", title: data?.[0]?.job_title || c.jobs?.title || "Direct enquiry" };
        })),
      ]);
      const named = new Map(names.map((n) => [n.id, n]));
      const visits = (rows ?? []).map((row) => {
        const convo = convs?.find((c) => c.id === row.conversation_id);
        const stage = stages?.find((s) => s.conversation_id === row.conversation_id);
        return {
          id: row.id,
          conversation_id: row.conversation_id,
          starts_at: row.starts_at,
          status: row.status,
          amount_pence: row.amount_pence,
          note: row.note,
          title: named.get(row.conversation_id)?.title ?? "Direct enquiry",
          customer: named.get(row.conversation_id)?.customer ?? "Customer",
          who: team?.find((m) => m.id === stage?.assignee_id)?.name ?? null,
          assigneeId: stage?.assignee_id ?? null,
          open: !convo?.archived_at,
        };
      });
      const people = (convs ?? []).filter((c) => !c.archived_at).map((c) => named.get(c.id)!).filter(Boolean);
      return { visits, people, team: team ?? [] };
    },
  });
  const cells = monthCells(cursor.year, cursor.month);
  const label = new Date(cursor.year, cursor.month, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const today = calendarDayKey(now);
  const visits = (q.data?.visits ?? []).filter((visit) => !member || visit.assigneeId === member);
  const byDay = new Map<string, Visit[]>();
  for (const visit of visits) {
    const key = visitDayKey(visit.starts_at);
    byDay.set(key, [...(byDay.get(key) ?? []), visit]);
  }
  const monthVisits = visits.filter((visit) => {
    const when = new Date(visit.starts_at);
    return when.getFullYear() === cursor.year && when.getMonth() === cursor.month;
  });
  const monthTotal = dayTakings(monthVisits.filter((visit) => isAgreedVisit(visit.status)).map((visit) => visit.amount_pence));
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const upcoming = visits.filter((visit) => new Date(visit.starts_at).getTime() >= startOfToday).slice(0, 5);
  const dayVisits = byDay.get(selected) ?? [];
  const selectedDate = visitInstant(selected, "12:00");
  const canRequest = !!selectedDate && selectedDate.getTime() >= startOfToday;
  function refresh() {
    void qc.invalidateQueries({ queryKey: ["business-calendar", uid] });
  }
  function showDay(key: string) {
    const when = visitInstant(key, "12:00");
    if (!when) return;
    setCursor({ year: when.getFullYear(), month: when.getMonth() });
    setSelected(key);
  }
  function shift(by: number) {
    const next = new Date(cursor.year, cursor.month + by, 1);
    setCursor({ year: next.getFullYear(), month: next.getMonth() });
    setSelected(calendarDayKey(next));
  }
  async function requestVisit(conversationId: string, when: Date, note: string) {
    if (when.getTime() < Date.now()) { toast.error("Pick a future date and time"); return false; }
    const { error } = await supabase.from("booking_requests").insert({
      conversation_id: conversationId,
      requested_by: uid,
      starts_at: when.toISOString(),
      note: note.trim() || null,
    });
    if (error) { toast.error(error.message); return false; }
    toast.success("Visit requested");
    refresh();
    return true;
  }
  async function saveNote(visit: Visit, raw: string) {
    const note = raw.trim().slice(0, NOTE_LIMIT) || null;
    if (note === (visit.note?.trim() || null)) return;
    const { error } = await supabase.from("booking_requests").update({ note }).eq("id", visit.id);
    if (error) { toast.error(error.message); return; }
    refresh();
  }
  async function saveAmount(visit: Visit, raw: string) {
    const trimmed = raw.trim();
    const amount_pence = trimmed ? invoiceAmountPence(trimmed) : null;
    if (trimmed && amount_pence == null) { toast.error("Enter the amount in pounds, such as 150 or 150.50"); return; }
    if (amount_pence === visit.amount_pence) return;
    const { error } = await supabase.from("booking_requests").update({ amount_pence }).eq("id", visit.id);
    if (error) { toast.error(error.message); return; }
    refresh();
  }
  async function cancelVisit(visit: Visit) {
    if (!window.confirm("Cancel this visit? Both of you will be notified.")) return;
    const { error } = await supabase.from("booking_requests").update({ status: "cancelled" }).eq("id", visit.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Visit cancelled");
    refresh();
  }

  return (
    <div className="grid gap-4">
      <p className="text-sm text-muted-foreground">Click a day to see who is coming, write a note, and record the amount. Cancel on the day, on the appointment, or in Coming up. Both of you are notified. Jobloom does not collect the money.</p>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button type="button" size="icon" variant="outline" aria-label="Previous month" onClick={() => shift(-1)}><ChevronLeft /></Button>
          <p className="min-w-36 text-center font-medium">{label}</p>
          <Button type="button" size="icon" variant="outline" aria-label="Next month" onClick={() => shift(1)}><ChevronRight /></Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(q.data?.team.length ?? 0) > 0 && (
            <select aria-label="Show visits for" className="rounded-md border border-input bg-background px-2 py-1 text-sm" value={member} onChange={(e) => setMember(e.target.value)}>
              <option value="">Everyone</option>
              {q.data?.team.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
            </select>
          )}
          <Button type="button" size="sm" variant="outline" onClick={() => showDay(today)}>This month</Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
        {WEEK.map((day) => <div key={day}>{day}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, index) => {
          const key = day == null ? `empty-${index}` : calendarDayKey(new Date(cursor.year, cursor.month, day));
          const dayVisits = day == null ? [] : byDay.get(key) ?? [];
          const agreed = dayVisits.some((visit) => isAgreedVisit(visit.status));
          const total = dayTakings(dayVisits.filter((visit) => isAgreedVisit(visit.status)).map((visit) => visit.amount_pence));
          return (
            <div
              key={key}
              className={`min-h-24 rounded-lg border p-1 text-left text-xs ${day == null ? "border-transparent" : agreed ? "border-bloom bg-bloom/15" : "border-border"} ${key === today ? "ring-1 ring-primary" : ""} ${key === selected ? "outline outline-2 outline-offset-1 outline-primary" : ""}`}
            >
              {day != null && (
                <>
                  <button type="button" className="font-medium" onClick={() => setSelected(key)}>{day}</button>
                  <ul className="mt-1 grid gap-1">
                    {dayVisits.map((visit) => (
                      <li key={visit.id} className={`rounded px-1 py-0.5 ${isAgreedVisit(visit.status) ? "bg-background" : "border border-dashed border-border"}`}>
                        <button type="button" className="block w-full truncate text-left" onClick={() => setSelected(key)}>
                          {new Date(visit.starts_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} {visit.customer}
                        </button>
                        {visit.open && <button type="button" className="underline" aria-label={`Cancel ${visit.customer}`} onClick={() => void cancelVisit(visit)}>Cancel</button>}
                      </li>
                    ))}
                  </ul>
                  {total > 0 && <p className="mt-1 font-medium">{formatPence(total)}</p>}
                </>
              )}
            </div>
          );
        })}
      </div>
      {monthTotal > 0 && <p className="text-sm font-medium">Agreed this month: {formatPence(monthTotal)}</p>}

      <section className="rounded-2xl border border-border bg-card p-4">
        <h3 className="font-medium">{dayHeading(selected)}</h3>
        {dayVisits.length === 0 && <p className="mt-2 text-sm text-muted-foreground">Nothing on this day yet.</p>}
        <ul className="mt-3 grid gap-3">
          {dayVisits.map((visit) => (
            <li key={visit.id} className="rounded-xl border border-border p-3 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{visit.customer}</p>
                  <p className="text-muted-foreground">{new Date(visit.starts_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} · {visit.title}{visit.who ? ` · ${visit.who}` : ""}</p>
                  <p className="text-xs text-muted-foreground">{isAgreedVisit(visit.status) ? "Agreed" : "Waiting for a reply"}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Link to="/messages/$id" params={{ id: visit.conversation_id }} className="underline">Open chat</Link>
                  {visit.open && <button type="button" className="underline" aria-label={`Cancel ${visit.customer} on this day`} onClick={() => void cancelVisit(visit)}>Cancel</button>}
                </div>
              </div>
              <Label className="mt-3 block" htmlFor={`note-${visit.id}`}>Note</Label>
              <textarea
                id={`note-${visit.id}`}
                key={`${visit.id}-${visit.note ?? ""}`}
                maxLength={NOTE_LIMIT}
                rows={2}
                defaultValue={visit.note ?? ""}
                placeholder="Access, what to bring, anything agreed"
                className="mt-1 w-full rounded-md border border-input bg-background px-2 py-1"
                onBlur={(e) => void saveNote(visit, e.target.value)}
              />
              {isAgreedVisit(visit.status) && (
                <div className="mt-2">
                  <Label htmlFor={`amount-${visit.id}`}>Amount agreed</Label>
                  <Input
                    id={`amount-${visit.id}`}
                    key={`${visit.id}-${visit.amount_pence ?? ""}`}
                    inputMode="decimal"
                    placeholder="150.00"
                    defaultValue={visit.amount_pence != null ? (visit.amount_pence / 100).toFixed(visit.amount_pence % 100 ? 2 : 0) : ""}
                    onBlur={(e) => void saveAmount(visit, e.target.value)}
                  />
                </div>
              )}
              {visit.open && (
                <div className="mt-3 flex flex-wrap items-end gap-2">
                  <form className="flex flex-wrap items-end gap-2" onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const input = new FormData(form).get("when");
                    const when = typeof input === "string" ? new Date(input) : new Date("");
                    if (!input || Number.isNaN(when.getTime())) { toast.error("Pick a future date and time"); return; }
                    void requestVisit(visit.conversation_id, when, visit.note ?? "").then((ok) => { if (ok) form.reset(); });
                  }}>
                    <div>
                      <Label htmlFor={`move-${visit.id}`}>Suggest a new time</Label>
                      <Input id={`move-${visit.id}`} name="when" type="datetime-local" required />
                      <p className="mt-1 text-xs text-muted-foreground">This time stays until they accept the new one.</p>
                    </div>
                    <Button type="submit" size="sm" variant="outline">Send new time</Button>
                  </form>
                </div>
              )}
            </li>
          ))}
        </ul>
        {canRequest && (q.data?.people.length ?? 0) > 0 && (
          <form className="mt-4 grid gap-2 border-t border-border pt-4" onSubmit={(e) => {
            e.preventDefault();
            const when = visitInstant(selected, draft.time);
            if (!draft.conversationId || !when) { toast.error("Choose the customer and a time"); return; }
            void requestVisit(draft.conversationId, when, draft.note).then((ok) => { if (ok) setDraft({ conversationId: "", time: "", note: "" }); });
          }}>
            <p className="text-sm font-medium">Request a visit on this day</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <select aria-label="Customer" className="rounded-md border border-input bg-background px-2 py-1 text-sm" value={draft.conversationId} onChange={(e) => setDraft({ ...draft, conversationId: e.target.value })} required>
                <option value="">Choose a customer</option>
                {q.data?.people.map((person) => <option key={person.id} value={person.id}>{person.customer} · {person.title}</option>)}
              </select>
              <Input aria-label="Time" type="time" value={draft.time} onChange={(e) => setDraft({ ...draft, time: e.target.value })} required />
            </div>
            <Input aria-label="Note" maxLength={NOTE_LIMIT} value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} placeholder="Note (optional)" />
            <Button type="submit" size="sm" variant="outline" className="w-fit">Send request</Button>
          </form>
        )}
        {!canRequest && <p className="mt-3 text-sm text-muted-foreground">Choose today or a later day to request a new visit.</p>}
      </section>

      <section>
        <h3 className="font-medium">Coming up</h3>
        {upcoming.length === 0 && <p className="mt-1 text-sm text-muted-foreground">No visits from today onwards.</p>}
        <ul className="mt-2 grid gap-1 text-sm">
          {upcoming.map((visit) => (
            <li key={visit.id} className="flex flex-wrap items-center justify-between gap-2">
              <button type="button" className="underline" onClick={() => showDay(visitDayKey(visit.starts_at))}>
                {new Date(visit.starts_at).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} · {visit.customer} · {visit.title}
              </button>
              {visit.open && <button type="button" className="underline" aria-label={`Cancel ${visit.customer} coming up`} onClick={() => void cancelVisit(visit)}>Cancel</button>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
