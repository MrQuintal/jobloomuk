import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

/** Loads profile photos for a set of users. Stored value is a path in the private "avatars" bucket, or a full URL (e.g. Google). */
export function useAvatars(ids: (string | null | undefined)[]) {
  const unique = [...new Set(ids.filter(Boolean) as string[])].sort();
  return useQuery({
    queryKey: ["avatars", unique],
    enabled: unique.length > 0,
    staleTime: 30 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase.rpc("public_avatars", { _ids: unique });
      const map: Record<string, string> = {};
      const paths = (data ?? []).filter((r) => r.avatar_url && !r.avatar_url.startsWith("http"));
      for (const r of data ?? []) if (r.avatar_url?.startsWith("http")) map[r.id] = r.avatar_url;
      if (paths.length) {
        const { data: signed } = await supabase.storage.from("avatars").createSignedUrls(paths.map((p) => p.avatar_url!), 3600);
        signed?.forEach((s, i) => { const p = paths[i]; if (s.signedUrl && p) map[p.id] = s.signedUrl; });
      }
      return map;
    },
  }).data ?? {};
}

export function UserAvatar({ url, name, className = "h-9 w-9" }: { url?: string | undefined; name?: string | null | undefined; className?: string }) {
  const initials = (name ?? "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <Avatar className={className}>
      {url && <AvatarImage src={url} alt={name ?? "Profile photo"} className="object-cover" />}
      <AvatarFallback className="bg-secondary text-xs font-medium">{initials}</AvatarFallback>
    </Avatar>
  );
}
