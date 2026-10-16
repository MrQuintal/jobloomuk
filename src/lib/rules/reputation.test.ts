import { describe, expect, it } from "vitest";
import { canReview, fairOrder, summarise } from "./reputation";

const both = { customer_confirmed_at: "x", worker_confirmed_at: "y" };
const r = (n: number) => ({ quality: n, reliability: n, communication: n, value: n });

describe("reputation rules", () => {
  it("reviews need both sides to confirm completion", () => {
    expect(canReview(both, true, false)).toBe(true);
    expect(canReview({ customer_confirmed_at: "x", worker_confirmed_at: null }, true, false)).toBe(false);
    expect(canReview(null, true, false)).toBe(false);
  });
  it("only the customer can review, once", () => {
    expect(canReview(both, false, false)).toBe(false);
    expect(canReview(both, true, true)).toBe(false);
  });
  it("hides the average below 3 reviews", () => {
    expect(summarise([r(5), r(5)])).toEqual({ count: 2, average: null });
    expect(summarise([r(5), r(4), r(3)])).toEqual({ count: 3, average: 4 });
  });
  it("interleaves newcomers with established professionals", () => {
    const now = Date.parse("2026-10-16");
    const old = (id: string) => ({ id, created_at: "2025-01-01" });
    const neu = (id: string) => ({ id, created_at: "2026-10-01" });
    expect(fairOrder([old("a"), old("b"), neu("c")], now).map((p) => p.id)).toEqual(["a", "c", "b"]);
  });
});
