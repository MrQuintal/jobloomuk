import { describe, expect, it } from "vitest";
import { publishBlockers, slugify } from "./profile";
import { allowedBookingActions } from "./booking";

describe("profile rules", () => {
  it("slugifies business names", () => {
    expect(slugify("Smith & Sons Plumbing Ltd.")).toBe("smith-and-sons-plumbing-ltd");
  });
  it("blocks publishing without a service", () => {
    expect(publishBlockers({ business_name: "A", headline: "B", base_area: "Leeds", specialismCount: 0 })).toEqual(["Choose at least one service"]);
  });
  it("allows publishing when complete", () => {
    expect(publishBlockers({ business_name: "A", headline: "B", base_area: "Leeds", specialismCount: 1 })).toEqual([]);
  });
});

describe("booking rules", () => {
  it("only the other party can accept or decline", () => {
    expect(allowedBookingActions({ status: "requested", requested_by: "a" }, "b")).toEqual(["accepted", "declined"]);
  });
  it("the requester can only cancel", () => {
    expect(allowedBookingActions({ status: "requested", requested_by: "a" }, "a")).toEqual(["cancelled"]);
  });
  it("decided bookings cannot change", () => {
    expect(allowedBookingActions({ status: "accepted", requested_by: "a" }, "b")).toEqual([]);
  });
});
