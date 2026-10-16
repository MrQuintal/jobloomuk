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

/** Mirrors messages body CHECK (1..4000 chars). */
export function isValidMessage(body: string): boolean {
  const t = body.trim();
  return t.length >= 1 && t.length <= 4000;
}

/** Mirrors availability_slots CHECKs. */
export function isValidSlot(weekday: number, start: string, end: string): boolean {
  return Number.isInteger(weekday) && weekday >= 0 && weekday <= 6 && end > start;
}
