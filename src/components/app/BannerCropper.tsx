import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { bannerDisplaySize, bannerSourceRect, clampBannerOffset } from "@/lib/banner-crop";

const OUTPUT_W = 1600;
const OUTPUT_H = 400;

export function BannerCropper({ file, busy, onCancel, onConfirm }: { file: File; busy: boolean; onCancel: () => void; onConfirm: (blob: Blob) => void }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const placed = useRef(false);
  const [url, setUrl] = useState<string | null>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [frame, setFrame] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const next = URL.createObjectURL(file);
    setUrl(next);
    setZoom(1);
    setNatural(null);
    placed.current = false;
    return () => URL.revokeObjectURL(next);
  }, [file]);

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const measure = () => {
      const box = el.getBoundingClientRect();
      setFrame({ w: box.width, h: box.height });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [url]);

  useEffect(() => {
    if (!natural || frame.w === 0 || placed.current) return;
    placed.current = true;
    const size = bannerDisplaySize(frame.w, frame.h, natural.w, natural.h, 1);
    setOffset({
      x: clampBannerOffset(frame.w, size.width, (frame.w - size.width) / 2),
      y: clampBannerOffset(frame.h, size.height, (frame.h - size.height) / 2),
    });
  }, [natural, frame.w, frame.h]);

  function changeZoom(next: number) {
    if (!natural || frame.w === 0) return;
    const before = bannerDisplaySize(frame.w, frame.h, natural.w, natural.h, zoom);
    const after = bannerDisplaySize(frame.w, frame.h, natural.w, natural.h, next);
    const cx = frame.w / 2;
    const cy = frame.h / 2;
    setZoom(next);
    setOffset({
      x: clampBannerOffset(frame.w, after.width, cx - ((cx - offset.x) / before.width) * after.width),
      y: clampBannerOffset(frame.h, after.height, cy - ((cy - offset.y) / before.height) * after.height),
    });
  }

  async function confirm() {
    const img = imageRef.current;
    if (!img || !natural || frame.w === 0) return;
    const { sx, sy, sw, sh } = bannerSourceRect(frame.w, frame.h, natural.w, natural.h, zoom, offset.x, offset.y);
    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_W;
    canvas.height = OUTPUT_H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, OUTPUT_W, OUTPUT_H);
    let quality = 0.92;
    let blob: Blob | null = null;
    while (quality >= 0.5) {
      blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
      if (blob && blob.size <= 8 * 1024 * 1024) break;
      quality -= 0.1;
    }
    if (!blob || blob.size > 8 * 1024 * 1024) { toast.error("That crop is still over 8 MB. Zoom in a little and try again."); return; }
    onConfirm(blob);
  }

  const shown = natural && frame.w > 0 ? bannerDisplaySize(frame.w, frame.h, natural.w, natural.h, zoom) : null;

  return (
    <div className="mt-3 grid gap-3">
      <p className="text-muted-foreground">Drag the photo and use the slider. The saved banner is 1600 × 400 px, 4:1.</p>
      <div
        ref={frameRef}
        className="relative aspect-[4/1] w-full cursor-grab touch-none overflow-hidden rounded-lg bg-muted active:cursor-grabbing"
        onPointerDown={(e) => {
          if (!natural) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          drag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
        }}
        onPointerMove={(e) => {
          const start = drag.current;
          if (!start || !natural || frame.w === 0) return;
          const size = bannerDisplaySize(frame.w, frame.h, natural.w, natural.h, zoom);
          setOffset({
            x: clampBannerOffset(frame.w, size.width, start.ox + e.clientX - start.x),
            y: clampBannerOffset(frame.h, size.height, start.oy + e.clientY - start.y),
          });
        }}
        onPointerUp={() => { drag.current = null; }}
        onPointerCancel={() => { drag.current = null; }}
      >
        {url && (
          <img
            src={url}
            alt="Banner crop preview"
            draggable={false}
            onLoad={(e) => {
              imageRef.current = e.currentTarget;
              setNatural({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight });
            }}
            className="absolute max-w-none select-none"
            style={shown ? { width: shown.width, height: shown.height, left: offset.x, top: offset.y } : { visibility: "hidden" }}
          />
        )}
      </div>
      <label className="flex items-center gap-3 text-xs text-muted-foreground">
        Zoom
        <input aria-label="Zoom" type="range" min={1} max={3} step={0.01} value={zoom} disabled={!natural || busy} onChange={(e) => changeZoom(Number(e.target.value))} className="w-full" />
      </label>
      <div className="flex gap-2">
        <Button type="button" variant="forest" size="sm" disabled={!natural || busy} onClick={() => void confirm()}>{busy ? "Saving…" : "Use this crop"}</Button>
        <Button type="button" variant="outline" size="sm" disabled={busy} onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}
