import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { calendarDayKey, dayTakings, isAgreedVisit, monthCells, visitDayKey } from "@/lib/rules/calendar";
import { invoiceAmountPence } from "@/lib/rules/invoice";
import { formatPence } from "@/lib/rules/plans";

const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type Visit = {
  id: string;
  conversation_id: string;
  starts_at: string;
  status: string;
  amount_pence: number | null;
  title: string;
  who: string | null;
};

export function BusinessCalendar({ uid }: { uid: string }) {
  const qc = useQueryClient();
  const [cursor, setCursor] = useState(() => { const n = new Date(); return { year: n.getFullYear(), month: n.getMonth() }; });
  const q = useQuery({
    queryKey: ["business-calendar", uid],
    queryFn: async () => {
      const { data: convs } = await supabase.from("conversations").select("id, jobs(title)").eq("worker_id", uid);
      const ids = (convs ?? []).map((c) => c.id);
      if (!ids.length) return [] as Visit[];
      const [{ data: rows }, { data: stages }, { data: team }] = await Promise.all([
        supabase.from("booking_requests").select("id, conversation_id, starts_at, status, amount_pence").in("conversation_id", ids).in("status", ["requested", "accepted"]).order("starts_at"),
        supabase.from("lead_stages").select("conversation_id, assignee_id").eq("worker_id", uid),
        supabase.from("team_members").select("id, name").eq("business_id", uid),
      ]);
      return (rows ?? []).map((row) => ({
        id: row.id,
        conversation_id: row.conversation_id,
        starts_at: row.starts_at,
        status: row.status,
        amount_pence: row.amount_pence,
        title: convs?.find((c) => c.id === row.conversation_id)?.jobs?.title ?? "Direct enquiry",
        who: team?.find((m) => m.id === stages?.find((s) => s.conversation_id === row.conversation_id)?.assignee_id)?.name ?? null,
      }));
    },
  });
  const cells = monthCells(cursor.year, cursor.month);
  const label = new Date(cursor.year, cursor.month, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const today = calendarDayKey(new Date());
  const byDay = new Map<string, Visit[]>();
  for (const visit of q.data ?? []) {
    const key = visitDayKey(visit.starts_at);
    byDay.set(key, [...(byDay.get(key) ?? []), visit]);
  }
  function shift(by: number) {
    const next = new Date(cursor.year, cursor.month + by, 1);
    setCursor({ year: next.getFullYear(), month: next.getMonth() });
  }
  async function saveAmount(visit: Visit, raw: string) {
    const trimmed = raw.trim();
    const amount_pence = trimmed ? invoiceAmountPence(trimmed) : null;
    if (trimmed && amount_pence == null) { toast.error("Enter the amount in pounds, such as 150 or 150.50"); return; }
    if (amount_pence === visit.amount_pence) return;
    const { error } = await supabase.from("booking_requests").update({ amount_pence }).eq("id", visit.id);
    if (error) { toast.error(error.message); return; }
    void qc.invalidateQueries({ queryKey: ["business-calendar", uid] });
  }
  return (
    <div className="grid gap-3">
      <p className="text-sm text-muted-foreground">Visits requested in messages appear on their day. A highlighted day is one both sides have agreed. Type what was agreed for that job. Jobloom does not collect it.</p>
      <div className="flex items-center justify-between gap-2">
        <Button type="button" size="icon" variant="outline" aria-label="Previous month" onClick={() => shift(-1)}><ChevronLeft /></Button>
        <p className="font-medium">{label}</p>
        <Button type="button" size="icon" variant="outline" aria-label="Next month" onClick={() => shift(1)}><ChevronRight /></Button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
        {WEEK.map((day) => <div key={day}>{day}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, index) => {
          const key = day == null ? `empty-${index}` : calendarDayKey(new Date(cursor.year, cursor.month, day));
          const visits = day == null ? [] : byDay.get(key) ?? [];
          const agreed = visits.some((visit) => isAgreedVisit(visit.status));
          const total = dayTakings(visits.filter((visit) => isAgreedVisit(visit.status)).map((visit) => visit.amount_pence));
          return (
            <div key={key} className={`min-h-24 rounded-lg border p-1 text-xs ${day == null ? "border-transparent" : agreed ? "border-bloom bg-bloom/15" : "border-border"} ${key === today ? "ring-1 ring-primary" : ""}`}>
              {day != null && (
                <>
                  <p className="font-medium">{day}</p>
                  <ul className="mt-1 grid gap-1">
                    {visits.map((visit) => (
                      <li key={visit.id} className={`rounded px-1 py-0.5 ${isAgreedVisit(visit.status) ? "bg-background" : "border border-dashed border-border"}`}>
                        <Link to="/messages/$id" params={{ id: visit.conversation_id }} className="block truncate underline">{visit.title}</Link>
                        <p className="text-muted-foreground">{new Date(visit.starts_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}{visit.who ? ` · ${visit.who}` : ""}</p>
                        {isAgreedVisit(visit.status) ? (
                          <input
                            key={`${visit.id}-${visit.amount_pence ?? ""}`}
                            aria-label={`Amount for ${visit.title}`}
                            inputMode="decimal"
                            placeholder="£"
                            defaultValue={visit.amount_pence != null ? (visit.amount_pence / 100).toFixed(visit.amount_pence % 100 ? 2 : 0) : ""}
                            className="mt-0.5 w-full rounded border border-input bg-background px-1"
                            onBlur={(e) => void saveAmount(visit, e.target.value)}
                          />
                        ) : <p className="text-muted-foreground">Waiting</p>}
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
    </div>
  );
}
