import { describe, expect, it } from "vitest";
import { parsePricingTips, pricingTipsForCategory } from "./pricing";

describe("category pricing tips", () => {
  it("selects the chosen category instead of a different trade", () => {
    expect(pricingTipsForCategory({ plumbing: ["A"], roofing: ["B"], general: ["C"] }, "plumbing")).toEqual(["A"]);
  });
  it("uses general guidance when no category tips exist", () => {
    expect(pricingTipsForCategory({ general: ["C"] }, "unknown")).toEqual(["C"]);
  });
  it("does not invent guidance when settings are missing", () => {
    expect(pricingTipsForCategory(null, "plumbing")).toEqual([]);
  });
  it("rejects non-string settings and empty entries", () => {
    expect(parsePricingTips({ plumbing: [1, null, " ", " A "], roofing: 42 })).toEqual({ plumbing: ["A"] });
  });
});