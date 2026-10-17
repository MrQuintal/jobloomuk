import { describe, expect, it } from "vitest";
import { bannerDisplaySize, bannerSourceRect, clampBannerOffset, minCoverZoom } from "./banner-crop";

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

  it("fits the whole photo at the furthest zoom out", () => {
    const zoom = minCoverZoom(800, 200, 400, 400);
    const size = bannerDisplaySize(800, 200, 400, 400, zoom);
    expect(size.width).toBeLessThanOrEqual(800);
    expect(size.height).toBeLessThanOrEqual(200);
    expect(size.width).toBeCloseTo(200, 5);
    expect(size.height).toBeCloseTo(200, 5);
  });

  it("keeps a zoomed-out photo inside the frame", () => {
    expect(clampBannerOffset(200, 100, -10)).toBe(0);
    expect(clampBannerOffset(200, 100, 150)).toBe(100);
    expect(clampBannerOffset(200, 100, 40)).toBe(40);
  });
});
