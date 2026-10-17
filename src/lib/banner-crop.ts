function coverScale(frameW: number, frameH: number, imageW: number, imageH: number) {
  return Math.max(frameW / imageW, frameH / imageH);
}

/** Smallest zoom that still shows the whole photo inside the frame. Zoom 1 fills the frame. */
export function minCoverZoom(frameW: number, frameH: number, imageW: number, imageH: number) {
  const cover = coverScale(frameW, frameH, imageW, imageH);
  if (!Number.isFinite(cover) || cover === 0) return 1;
  return Math.min(frameW / imageW, frameH / imageH) / cover;
}

/** Visible window mapped back onto the original photo, in image pixels. */
export function bannerSourceRect(frameW: number, frameH: number, imageW: number, imageH: number, zoom: number, offsetX: number, offsetY: number) {
  const scale = coverScale(frameW, frameH, imageW, imageH) * zoom;
  return {
    sx: -offsetX / scale,
    sy: -offsetY / scale,
    sw: frameW / scale,
    sh: frameH / scale,
  };
}

/** Keeps a zoomed-in photo covering the frame, and a zoomed-out photo inside it. */
export function clampBannerOffset(frame: number, displayed: number, offset: number) {
  const min = Math.min(0, frame - displayed);
  const max = Math.max(0, frame - displayed);
  return Math.min(max, Math.max(min, offset));
}

export function bannerDisplaySize(frameW: number, frameH: number, imageW: number, imageH: number, zoom: number) {
  const scale = coverScale(frameW, frameH, imageW, imageH) * zoom;
  return { width: imageW * scale, height: imageH * scale };
}

/** Where the photo sits in the saved image. Coordinates can fall outside when it is zoomed in. */
export function bannerDestRect(frameW: number, frameH: number, outputW: number, outputH: number, imageW: number, imageH: number, zoom: number, offsetX: number, offsetY: number) {
  const size = bannerDisplaySize(frameW, frameH, imageW, imageH, zoom);
  return {
    x: offsetX * (outputW / frameW),
    y: offsetY * (outputH / frameH),
    width: size.width * (outputW / frameW),
    height: size.height * (outputH / frameH),
  };
}
