import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PhotoLightbox } from "@/components/app/PhotoLightbox";

export function JobPhotos({ paths }: { paths: string[] | null | undefined }) {
  const list = paths ?? [];
  const [open, setOpen] = useState<number | null>(null);
  const photos = useQuery({
    queryKey: ["job-photos", list],
    enabled: list.length > 0,
    queryFn: async () => {
      const { data } = await supabase.storage.from("job-photos").createSignedUrls(list, 60 * 60);
      return (data ?? []).flatMap((item) => (item.signedUrl ? [item.signedUrl] : []));
    },
  });
  const urls = photos.data ?? [];
  if (urls.length === 0) return null;
  return (
    <>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {urls.map((url, index) => (
          <button key={url} type="button" className="overflow-hidden rounded-lg" aria-label="View larger job photo" onClick={() => setOpen(index)}>
            <img src={url} alt="" className="aspect-[4/3] w-full object-cover" />
          </button>
        ))}
      </div>
      {open != null && <PhotoLightbox images={urls} title="Job photo" start={open} onClose={() => setOpen(null)} />}
    </>
  );
}
