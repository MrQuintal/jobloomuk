import { describe, expect, it } from "vitest";
import { canRespondToJob, isValidMessage, isValidSlot, nextBookingStatuses, slugify } from "./marketplace";

describe("marketplace rules", () => {
  it("slugifies business names", () => {
    expect(slugify("Smith & Sons Plumbing Ltd.")).toBe("smith-sons-plumbing-ltd");
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
