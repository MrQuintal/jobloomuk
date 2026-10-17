import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BannerCropper } from "@/components/app/BannerCropper";
import { UserAvatar, useAvatars } from "@/components/app/UserAvatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { profilePhotoSourceProblem } from "@/lib/profile-photo";

export function HeaderAvatar() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const av = useAvatars([user?.id]);
  const nameQ = useQuery({
    queryKey: ["header-name", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("profiles").select("display_name").eq("id", user!.id).maybeSingle()).data?.display_name ?? null,
  });
  const [busy, setBusy] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const chosenAt = useRef(0);
  if (!user) return null;
  const name = nameQ.data || user.email || "You";

  function choose(file: File) {
    const problem = profilePhotoSourceProblem(file);
    if (problem) { toast.error(problem); return; }
    chosenAt.current = Date.now();
    setCropFile(file);
  }

  async function upload(blob: Blob) {
    setBusy(true);
    const path = `${user!.id}/${Date.now()}.jpg`;
    const up = await supabase.storage.from("avatars").upload(path, blob, { upsert: true, contentType: "image/jpeg" });
    if (up.error) { toast.error(up.error.message); setBusy(false); return; }
    const { error } = await supabase.from("profiles").update({ avatar_url: path }).eq("id", user!.id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setCropFile(null);
    toast.success("Profile photo updated");
    void qc.invalidateQueries({ queryKey: ["avatars"] });
  }

  return (
    <>
      <button type="button" aria-label="Update profile photo" className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" disabled={busy} onClick={() => { if (inputRef.current) inputRef.current.value = ""; inputRef.current?.click(); }}>
        <UserAvatar url={av[user.id]} name={name} className="h-9 w-9" />
      </button>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={busy} onChange={(e) => { const file = e.target.files?.[0]; if (file) choose(file); }} />
      <Dialog open={!!cropFile} onOpenChange={(open) => { if (!open && !busy) setCropFile(null); }}>
        <DialogContent onInteractOutside={(e) => { if (Date.now() - chosenAt.current < 800) e.preventDefault(); }}>
          <DialogHeader>
            <DialogTitle>Update profile photo</DialogTitle>
          </DialogHeader>
          {cropFile && (
            <BannerCropper
              file={cropFile}
              busy={busy}
              outputWidth={800}
              outputHeight={800}
              maxBytes={5 * 1024 * 1024}
              hint="Drag the photo and use the slider. Zoom out to fit the whole photo. The saved photo is square."
              frameClassName="aspect-square w-full max-w-72 rounded-full"
              alt="Profile photo crop preview"
              onCancel={() => setCropFile(null)}
              onConfirm={(blob) => void upload(blob)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
