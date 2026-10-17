import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export function PhotoLightbox({ images, title, start, onClose }: { images: string[]; title: string; start: number; onClose: () => void }) {
  const [index, setIndex] = useState(start);
  const count = images.length;
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (count < 2) return;
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % count);
      if (e.key === "ArrowLeft") setIndex((i) => (i - 1 + count) % count);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [count]);
  const src = images[index] ?? images[0];
  if (!src) return null;

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        className="flex h-[100dvh] max-h-[100dvh] w-screen max-w-[100vw] items-center justify-center border-0 bg-transparent p-0 text-white shadow-none sm:rounded-none"
        onClick={onClose}
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <img src={src} alt={title} className="max-h-[85dvh] max-w-[92vw] object-contain" onClick={(e) => e.stopPropagation()} />
        {count > 1 && (
          <>
            <button type="button" aria-label="Previous photo" className="absolute left-3 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/60" onClick={(e) => { e.stopPropagation(); setIndex((i) => (i - 1 + count) % count); }}>
              <ChevronLeft className="size-6" />
            </button>
            <button type="button" aria-label="Next photo" className="absolute right-3 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/60" onClick={(e) => { e.stopPropagation(); setIndex((i) => (i + 1) % count); }}>
              <ChevronRight className="size-6" />
            </button>
            <p className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-sm">{index + 1} of {count}</p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
