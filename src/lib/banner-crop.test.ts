import { describe, expect, it } from "vitest";
import { bannerDisplaySize, bannerSourceRect, clampBannerOffset } from "./banner-crop";

describe("banner crop", () => {
  it("maps the frame back onto the photo", () => {
    const frameW = 800;
    const frameH = 200;
    const rect = bannerSourceRect(frameW, frameH, 1600, 800, 1, -400, -300);
    expect(rect.sw / rect.sh).toBeCloseTo(4, 5);
    expect(rect.sx).toBeCloseTo(800, 5);
    expect(rect.sy).toBeCloseTo(600, 5);
  });

  it("stops the photo sliding out of the frame", () => {
    expect(clampBannerOffset(200, 400, 20)).toBe(0);
    expect(clampBannerOffset(200, 400, -300)).toBe(-200);
    expect(clampBannerOffset(200, 400, -50)).toBe(-50);
  });

  it("covers the frame at the starting zoom", () => {
    const size = bannerDisplaySize(800, 200, 400, 400, 1);
    expect(size.width).toBeGreaterThanOrEqual(800);
    expect(size.height).toBeGreaterThanOrEqual(200);
  });
});
