/** Visible 4:1 window mapped back onto the original photo, in image pixels. */
export function bannerSourceRect(frameW: number, frameH: number, imageW: number, imageH: number, zoom: number, offsetX: number, offsetY: number) {
  const scale = Math.max(frameW / imageW, frameH / imageH) * zoom;
  return {
    sx: -offsetX / scale,
    sy: -offsetY / scale,
    sw: frameW / scale,
    sh: frameH / scale,
  };
}

/** Keeps the photo covering the frame while it is dragged. */
export function clampBannerOffset(frame: number, displayed: number, offset: number) {
  return Math.min(0, Math.max(frame - displayed, offset));
}

export function bannerDisplaySize(frameW: number, frameH: number, imageW: number, imageH: number, zoom: number) {
  const scale = Math.max(frameW / imageW, frameH / imageH) * zoom;
  return { width: imageW * scale, height: imageH * scale };
}
