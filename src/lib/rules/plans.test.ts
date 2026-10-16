import { describe, expect, it } from "vitest";
import { currentTier, hasAccess, PRICES_PENCE, tierForPriceId } from "./plans";

const now = new Date("2026-10-16T12:00:00Z");
const future = "2026-11-16T12:00:00Z";
const past = "2026-10-01T12:00:00Z";

describe("plans", () => {
  it("Pro is £6/month and Business £10/month", () => {
    expect(PRICES_PENCE.pro.month).toBe(600);
    expect(PRICES_PENCE.business.month).toBe(1000);
  });
  it("annual is 10× monthly (2 months free)", () => {
    expect(PRICES_PENCE.pro.year).toBe(6000);
    expect(PRICES_PENCE.business.year).toBe(10000);
  });
  it("cancelled keeps access until end of paid period", () => {
    expect(hasAccess({ status: "canceled", price_id: "pro_monthly", current_period_end: future }, now)).toBe(true);
    expect(hasAccess({ status: "canceled", price_id: "pro_monthly", current_period_end: past }, now)).toBe(false);
  });
  it("maps price ids to tiers", () => {
    expect(tierForPriceId("business_yearly")).toBe("business");
    expect(currentTier(null, now)).toBe("free");
    expect(currentTier({ status: "incomplete", price_id: "pro_monthly", current_period_end: future }, now)).toBe("free");
  });
});
