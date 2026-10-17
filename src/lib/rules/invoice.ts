/** Pounds typed by a professional, stored as pence. Empty, zero, and more than two decimal places are refused. */
export function invoiceAmountPence(raw: string): number | null {
  const cleaned = raw.trim().replace(/^£/, "").replace(/,/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const [whole, fraction = ""] = cleaned.split(".");
  const pence = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(pence) || pence < 1 || pence > 100_000_000) return null;
  return pence;
}

export function invoiceNumberLabel(number: number): string {
  return `INV-${String(number).padStart(3, "0")}`;
}
