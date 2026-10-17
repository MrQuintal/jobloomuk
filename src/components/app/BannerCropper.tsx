import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { bannerDestRect, bannerDisplaySize, clampBannerOffset, minCoverZoom } from "@/lib/banner-crop";

export function BannerCropper({
  file,
  busy,
  onCancel,
  onConfirm,
  outputWidth = 1600,
  outputHeight = 400,
  maxBytes = 8 * 1024 * 1024,
  hint = "Drag the photo and use the slider. Zoom out to fit the whole photo. The saved banner is 1600 × 400 px, 4:1.",
  frameClassName = "aspect-[4/1] w-full rounded-lg",
  alt = "Banner crop preview",
}: {
  file: File;
  busy: boolean;
  onCancel: () => void;
  onConfirm: (blob: Blob) => void;
  outputWidth?: number;
  outputHeight?: number;
  maxBytes?: number;
  hint?: string;
  frameClassName?: string;
  alt?: string;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const placed = useRef(false);
  const listening = useRef(true);
  const retried = useRef(false);
  const errorTimer = useRef<number | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [frame, setFrame] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const next = URL.createObjectURL(file);
    listening.current = true;
    retried.current = false;
    setUrl(next);
    setZoom(1);
    setNatural(null);
    placed.current = false;
    return () => {
      listening.current = false;
      if (errorTimer.current != null) window.clearTimeout(errorTimer.current);
      errorTimer.current = null;
      URL.revokeObjectURL(next);
    };
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

  const minZoom = natural && frame.w > 0 ? minCoverZoom(frame.w, frame.h, natural.w, natural.h) : 1;

  function changeZoom(next: number) {
    if (!natural || frame.w === 0) return;
    const clamped = Math.min(3, Math.max(minZoom, next));
    const before = bannerDisplaySize(frame.w, frame.h, natural.w, natural.h, zoom);
    const after = bannerDisplaySize(frame.w, frame.h, natural.w, natural.h, clamped);
    const cx = frame.w / 2;
    const cy = frame.h / 2;
    setZoom(clamped);
    setOffset({
      x: clampBannerOffset(frame.w, after.width, cx - ((cx - offset.x) / before.width) * after.width),
      y: clampBannerOffset(frame.h, after.height, cy - ((cy - offset.y) / before.height) * after.height),
    });
  }

  async function confirm() {
    const img = imageRef.current;
    if (!img || !natural || frame.w === 0) return;
    const canvas = document.createElement("canvas");
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    const ctx = canvas.getContext("2d");
    const frameEl = frameRef.current;
    if (!ctx || !frameEl) return;
    ctx.fillStyle = getComputedStyle(frameEl).backgroundColor;
    ctx.fillRect(0, 0, outputWidth, outputHeight);
    const dest = bannerDestRect(frame.w, frame.h, outputWidth, outputHeight, natural.w, natural.h, zoom, offset.x, offset.y);
    ctx.drawImage(img, dest.x, dest.y, dest.width, dest.height);
    let quality = 0.92;
    let blob: Blob | null = null;
    const limitLabel = `${Math.round(maxBytes / (1024 * 1024))} MB`;
    while (quality >= 0.5) {
      blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
      if (blob && blob.size <= maxBytes) break;
      quality -= 0.1;
    }
    if (!blob || blob.size > maxBytes) { toast.error(`That crop is still over ${limitLabel}. Zoom in a little and try again.`); return; }
    onConfirm(blob);
  }

  const shown = natural && frame.w > 0 ? bannerDisplaySize(frame.w, frame.h, natural.w, natural.h, zoom) : null;

  return (
    <div className="mt-3 grid gap-3">
      <p className="text-muted-foreground">{hint}</p>
      <div
        ref={frameRef}
        className={`relative cursor-grab touch-none overflow-hidden bg-muted active:cursor-grabbing ${frameClassName}`}
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
            alt={alt}
            draggable={false}
            onLoad={(e) => {
              if (errorTimer.current != null) window.clearTimeout(errorTimer.current);
              errorTimer.current = null;
              imageRef.current = e.currentTarget;
              if (e.currentTarget.naturalWidth > 0) setNatural({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight });
            }}
            onError={(e) => {
              if (!listening.current) return;
              if (!retried.current && url) {
                retried.current = true;
                e.currentTarget.src = "";
                e.currentTarget.src = url;
                return;
              }
              if (errorTimer.current != null) window.clearTimeout(errorTimer.current);
              errorTimer.current = window.setTimeout(() => {
                errorTimer.current = null;
                if (!listening.current) return;
                const img = imageRef.current;
                if (img && img.naturalWidth > 0) {
                  setNatural({ w: img.naturalWidth, h: img.naturalHeight });
                  return;
                }
                toast.error("This photo can't be opened here. Save it as a JPEG and try again.");
                onCancel();
              }, 700);
            }}
            className="absolute max-w-none select-none"
            style={shown ? { width: shown.width, height: shown.height, left: offset.x, top: offset.y, opacity: 1 } : { width: "100%", height: "100%", objectFit: "cover", opacity: 0 }}
          />
        )}
      </div>
      <label className="flex items-center gap-3 text-xs text-muted-foreground">
        Zoom
        <input aria-label="Zoom" type="range" min={minZoom} max={3} step={0.01} value={zoom} disabled={!natural || busy} onChange={(e) => changeZoom(Number(e.target.value))} className="w-full" />
      </label>
      <div className="flex gap-2">
        <Button type="button" variant="forest" size="sm" disabled={!natural || busy} onClick={() => void confirm()}>{busy ? "Saving…" : "Use this crop"}</Button>
        <Button type="button" variant="outline" size="sm" disabled={busy} onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}
