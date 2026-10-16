import { describe, expect, it } from "vitest";
import { milesBetween, withinRadius } from "./distance";

describe("distance", () => {
  it("London to Birmingham is about 101 miles", () => {
    const d = milesBetween({ lat: 51.5074, lng: -0.1278 }, { lat: 52.4862, lng: -1.8904 });
    expect(d).toBeGreaterThan(98);
    expect(d).toBeLessThan(104);
  });
  it("radius filter excludes jobs further than chosen miles", () => {
    expect(withinRadius(12, 10)).toBe(false);
    expect(withinRadius(9.9, 10)).toBe(true);
  });
  it("any distance includes unknown locations; a radius excludes them", () => {
    expect(withinRadius(null, null)).toBe(true);
    expect(withinRadius(null, 25)).toBe(false);
  });
});
