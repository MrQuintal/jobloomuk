/** Marketplace rules. Each mirrors a DB constraint, policy or trigger. */

export type JobStatus = "open" | "paused" | "closed";
export type ResponseStatus = "sent" | "accepted" | "declined" | "withdrawn";
export type BookingStatus = "requested" | "accepted" | "declined" | "cancelled";

export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Mirrors the job_responses INSERT policy. */
export function canRespondToJob(job: { status: JobStatus; customer_id: string }, workerId: string): boolean {
  return job.status === "open" && job.customer_id !== workerId;
}

/** Mirrors the guard_booking_update trigger. */
export function nextBookingStatuses(status: BookingStatus, isRequester: boolean): BookingStatus[] {
  if (status !== "requested") return [];
  return isRequester ? ["cancelled"] : ["accepted", "declined"];
}

/** A saved alert word: 2 to 40 characters, compared without regard to capital letters. */
export function alertKeyword(raw: string): string | null {
  const word = raw.trim().toLowerCase().replace(/\s+/g, " ");
  if (word.length < 2 || word.length > 40) return null;
  return word;
}

/** True when this person has removed the conversation from their own inbox. */
export function hiddenFromInbox(c: { customer_id: string; worker_id: string; customer_hidden_at: string | null; worker_hidden_at: string | null }, userId: string): boolean {
  if (c.customer_id === userId) return c.customer_hidden_at != null;
  if (c.worker_id === userId) return c.worker_hidden_at != null;
  return false;
}

/** Mirrors messages body CHECK (1..4000 chars). */
export function isValidMessage(body: string): boolean {
  const t = body.trim();
  return t.length >= 1 && t.length <= 4000;
}

/** Mirrors availability_slots CHECKs. */
export function isValidSlot(weekday: number, start: string, end: string): boolean {
  return Number.isInteger(weekday) && weekday >= 0 && weekday <= 6 && end > start;
}
