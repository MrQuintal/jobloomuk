import { describe, expect, it } from "vitest";
import { alertKeyword, canRespondToJob, hiddenFromInbox, isValidMessage, isValidSlot, nextBookingStatuses, profileSlug, slugify } from "./marketplace";

describe("marketplace rules", () => {
  it("slugifies business names", () => {
    expect(slugify("Smith & Sons Plumbing Ltd.")).toBe("smith-sons-plumbing-ltd");
  });
  it("accepts a custom profile address and refuses reserved or short ones", () => {
    expect(profileSlug(" Bunny Flop ")).toBe("bunny-flop");
    expect(profileSlug("jobs")).toBeNull();
    expect(profileSlug("ab")).toBeNull();
  });
  it("workers can only respond to open jobs that aren't their own", () => {
    expect(canRespondToJob({ status: "open", customer_id: "c" }, "w")).toBe(true);
    expect(canRespondToJob({ status: "closed", customer_id: "c" }, "w")).toBe(false);
    expect(canRespondToJob({ status: "open", customer_id: "w" }, "w")).toBe(false);
  });
  it("only the other party accepts or declines a booking; the requester can cancel", () => {
    expect(nextBookingStatuses("requested", false)).toEqual(["accepted", "declined"]);
    expect(nextBookingStatuses("requested", true)).toEqual(["cancelled"]);
    expect(nextBookingStatuses("accepted", false)).toEqual([]);
  });
  it("keeps alert words between 2 and 40 characters", () => {
    expect(alertKeyword("  Boiler ")).toBe("boiler");
    expect(alertKeyword("kitchen  tap")).toBe("kitchen tap");
    expect(alertKeyword("a")).toBeNull();
    expect(alertKeyword("x".repeat(41))).toBeNull();
  });
  it("hides a conversation only for the person who removed it", () => {
    const c = { customer_id: "c", worker_id: "w", customer_hidden_at: "2026-10-17T12:00:00Z", worker_hidden_at: null };
    expect(hiddenFromInbox(c, "c")).toBe(true);
    expect(hiddenFromInbox(c, "w")).toBe(false);
  });
  it("messages must be 1 to 4000 characters", () => {
    expect(isValidMessage("  ")).toBe(false);
    expect(isValidMessage("x".repeat(4001))).toBe(false);
    expect(isValidMessage("Hello")).toBe(true);
  });
  it("availability end must be after start", () => {
    expect(isValidSlot(1, "09:00", "17:00")).toBe(true);
    expect(isValidSlot(1, "17:00", "09:00")).toBe(false);
    expect(isValidSlot(7, "09:00", "17:00")).toBe(false);
  });
});
