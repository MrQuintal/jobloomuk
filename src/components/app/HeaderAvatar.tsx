import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { UserAvatar, useAvatars } from "@/components/app/UserAvatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { profilePhotoSourceProblem, profilePhotoToStore } from "@/lib/profile-photo";

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
  if (!user) return null;
  const name = nameQ.data || user.email || "You";

  async function upload(file: File) {
    const problem = profilePhotoSourceProblem(file);
    if (problem) { toast.error(problem); return; }
    setBusy(true);
    const stored = await profilePhotoToStore(file);
    if (!stored) { toast.error("This photo can't be opened here. Save it as a JPEG and try again."); setBusy(false); return; }
    const path = `${user!.id}/${Date.now()}.${stored.ext}`;
    const up = await supabase.storage.from("avatars").upload(path, stored.body, { upsert: true, contentType: stored.contentType });
    if (up.error) { toast.error(up.error.message); setBusy(false); return; }
    const { error } = await supabase.from("profiles").update({ avatar_url: path }).eq("id", user!.id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Profile photo updated");
    void qc.invalidateQueries({ queryKey: ["avatars"] });
  }

  return (
    <>
      <button type="button" aria-label="Update profile photo" className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" disabled={busy} onClick={() => { if (inputRef.current) inputRef.current.value = ""; inputRef.current?.click(); }}>
        <UserAvatar url={av[user.id]} name={name} className="h-9 w-9" />
      </button>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={busy} onChange={(e) => { const file = e.target.files?.[0]; if (file) void upload(file); }} />
    </>
  );
}
