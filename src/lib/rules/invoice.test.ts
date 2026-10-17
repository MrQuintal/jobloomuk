import { describe, expect, it } from "vitest";
import { invoiceAmountPence, invoiceNumberLabel } from "./invoice";

describe("invoices", () => {
  it("reads a pound amount as pence", () => {
    expect(invoiceAmountPence("150")).toBe(15000);
    expect(invoiceAmountPence("£1,250.50")).toBe(125050);
    expect(invoiceAmountPence("0.01")).toBe(1);
  });
  it("refuses a blank, zero, or over-precise amount", () => {
    expect(invoiceAmountPence("")).toBeNull();
    expect(invoiceAmountPence("0")).toBeNull();
    expect(invoiceAmountPence("12.345")).toBeNull();
    expect(invoiceAmountPence("1000001")).toBeNull();
  });
  it("labels the invoice number", () => {
    expect(invoiceNumberLabel(7)).toBe("INV-007");
  });
});
