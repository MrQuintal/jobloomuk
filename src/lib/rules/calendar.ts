/** A Monday-first month grid. Empty cells pad the first and last week. */
export function monthCells(year: number, month: number): (number | null)[] {
  const first = new Date(year, month, 1);
  const pad = (first.getDay() + 6) % 7;
  const count = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array.from({ length: pad }, () => null);
  for (let day = 1; day <= count; day++) cells.push(day);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function calendarDayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function visitDayKey(iso: string): string {
  return calendarDayKey(new Date(iso));
}

/** An accepted visit is the date both sides agreed. */
export function isAgreedVisit(status: string): boolean {
  return status === "accepted";
}

export function dayTakings(pence: (number | null | undefined)[]): number {
  return pence.reduce<number>((sum, amount) => sum + (amount ?? 0), 0);
}
