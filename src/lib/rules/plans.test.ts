import { describe, expect, it } from "vitest";
import { currentTier, effectiveTier, hasAccess, PRICES_PENCE, tierForPriceId } from "./plans";

const now = new Date("2026-10-16T12:00:00Z");
const future = "2026-11-16T12:00:00Z";
const past = "2026-10-01T12:00:00Z";

describe("plans", () => {
  it("a Business grant upgrades a professional without changing their subscription", () => {
    const sub = { status: "active", price_id: "pro_monthly", current_period_end: future };
    expect(effectiveTier(sub, true, now)).toBe("business");
    expect(currentTier(sub, now)).toBe("pro");
    expect(sub.price_id).toBe("pro_monthly");
    expect(effectiveTier(null, true, now)).toBe("business");
  });
  it("removing a grant restores the underlying paid or free plan", () => {
    expect(effectiveTier({ status: "active", price_id: "pro_monthly", current_period_end: future }, false, now)).toBe("pro");
    expect(effectiveTier(null, false, now)).toBe("free");
    expect(effectiveTier({ status: "active", price_id: "business_monthly", current_period_end: future }, false, now)).toBe("business");
  });
  it("a complimentary Pro grant gives Pro to a free user but never lowers a paid Business plan", () => {
    expect(effectiveTier(null, "pro", now)).toBe("pro");
    expect(effectiveTier({ status: "active", price_id: "business_monthly", current_period_end: future }, "pro", now)).toBe("business");
    expect(effectiveTier({ status: "active", price_id: "pro_monthly", current_period_end: future }, "business", now)).toBe("business");
  });
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

import { canAddPortfolioProject, conversionRate, responseTimeLabel } from "./plans";
describe("plan feature limits", () => {
  it("free plan stops at 3 portfolio projects", () => {
    expect(canAddPortfolioProject("free", 2)).toBe(true);
    expect(canAddPortfolioProject("free", 3)).toBe(false);
  });
  it("pro and business are unlimited", () => {
    expect(canAddPortfolioProject("pro", 50)).toBe(true);
    expect(canAddPortfolioProject("business", 50)).toBe(true);
  });
  it("conversion is enquiries over views", () => {
    expect(conversionRate(200, 10)).toBe(5);
    expect(conversionRate(0, 3)).toBe(0);
  });
  it("describes a typical reply time", () => {
    expect(responseTimeLabel(null)).toBeNull();
    expect(responseTimeLabel(30 * 60)).toBe("Usually replies within an hour");
    expect(responseTimeLabel(3 * 60 * 60)).toBe("Usually replies within a few hours");
    expect(responseTimeLabel(20 * 60 * 60)).toBe("Usually replies within a day");
    expect(responseTimeLabel(2 * 24 * 60 * 60)).toBe("Usually replies within a few days");
    expect(responseTimeLabel(8 * 24 * 60 * 60)).toBe("Usually replies within a week");
  });
});
