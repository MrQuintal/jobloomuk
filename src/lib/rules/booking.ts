export type BookingStatus = "requested" | "accepted" | "declined" | "cancelled";

/** Mirrors public.guard_booking_update: who may move a booking to which status. */
export function allowedBookingActions(b: { status: BookingStatus; requested_by: string }, me: string): BookingStatus[] {
  if (b.status !== "requested") return [];
  return b.requested_by === me ? ["cancelled"] : ["accepted", "declined"];
}
