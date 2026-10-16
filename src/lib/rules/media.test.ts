import { describe, expect, it } from "vitest";
import { isValidVideoUrl, videoEmbedUrl, withSponsored } from "./media";

describe("portfolio videos", () => {
  it("accepts YouTube and Vimeo links only", () => {
    expect(isValidVideoUrl("https://www.youtube.com/watch?v=abc123XYZ")).toBe(true);
    expect(isValidVideoUrl("https://vimeo.com/123456")).toBe(true);
    expect(isValidVideoUrl("https://example.com/video.mp4")).toBe(false);
  });
  it("builds embed links", () => {
    expect(videoEmbedUrl("https://youtu.be/abc123XYZ")).toBe("https://www.youtube-nocookie.com/embed/abc123XYZ");
    expect(videoEmbedUrl("https://vimeo.com/123456")).toBe("https://player.vimeo.com/video/123456");
  });
});

describe("sponsored placement", () => {
  it("lifts at most 2 sponsored profiles and labels them", () => {
    const list = [{ id: 1, is_sponsored: false }, { id: 2, is_sponsored: true }, { id: 3, is_sponsored: true }, { id: 4, is_sponsored: true }];
    const out = withSponsored(list);
    expect(out.map((p) => p.id)).toEqual([2, 3, 1, 4]);
    expect(out.filter((p) => p.sponsored).length).toBe(2);
  });
});
