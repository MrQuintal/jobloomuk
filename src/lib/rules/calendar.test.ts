import { describe, expect, it } from "vitest";
import { calendarDayKey, dayTakings, isAgreedVisit, monthCells, visitDayKey, visitInstant } from "./calendar";

describe("business calendar", () => {
  it("starts the month on Monday", () => {
    const cells = monthCells(2026, 9);
    expect(cells[3]).toBe(1);
    expect(cells.slice(0, 3)).toEqual([null, null, null]);
    expect(cells).toHaveLength(35);
  });
  it("keys a visit by the local day", () => {
    const day = new Date(2026, 9, 17, 15, 30);
    expect(calendarDayKey(day)).toBe("2026-10-17");
    expect(visitDayKey(day.toISOString())).toBe("2026-10-17");
    expect(visitInstant("2026-10-17", "15:30")?.getHours()).toBe(15);
    expect(visitInstant("2026-02-31", "09:00")).toBeNull();
  });
  it("treats an accepted visit as agreed and adds the amounts entered", () => {
    expect(isAgreedVisit("accepted")).toBe(true);
    expect(isAgreedVisit("requested")).toBe(false);
    expect(dayTakings([15000, null, 2500])).toBe(17500);
  });
});
